using System.Security.Claims;
using System.Security.Cryptography;
using System.Text.Json;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.Data.Sqlite;

var web = Directory.Exists("wwwroot") ? "wwwroot" : Path.GetFullPath("../../prototype");
var builder = WebApplication.CreateBuilder(new WebApplicationOptions { Args = args, WebRootPath = web });

var dataDir = builder.Configuration["Mappe:DataDir"] ?? "data";
var allowSignup = builder.Configuration.GetValue("Mappe:AllowSignup", true);
Directory.CreateDirectory(dataDir);
var conn = $"Data Source={Path.Combine(dataDir, "mappe.db")}";

builder.Services.AddDataProtection().PersistKeysToFileSystem(new DirectoryInfo(Path.Combine(dataDir, "keys")));
builder.Services.AddAuthentication(CookieAuthenticationDefaults.AuthenticationScheme).AddCookie(o =>
{
    o.Cookie.Name = "mappe";
    o.ExpireTimeSpan = TimeSpan.FromDays(30);
    o.SlidingExpiration = true;
    o.Events.OnRedirectToLogin = c => { c.Response.StatusCode = 401; return Task.CompletedTask; };
});
builder.Services.AddAuthorization();
builder.Services.ConfigureHttpJsonOptions(o => o.SerializerOptions.PropertyNameCaseInsensitive = true);

var app = builder.Build();

using (var db = Open())
    Exec(db, """
        CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, name TEXT NOT NULL UNIQUE COLLATE NOCASE, hash TEXT NOT NULL);
        CREATE TABLE IF NOT EXISTS docs (user_id INTEGER NOT NULL, id TEXT NOT NULL, json TEXT NOT NULL, PRIMARY KEY (user_id, id));
        CREATE TABLE IF NOT EXISTS pages (slug TEXT PRIMARY KEY, user_id INTEGER NOT NULL, json TEXT NOT NULL);
        """);

app.UseDefaultFiles();
app.UseStaticFiles();
app.UseAuthentication();
app.UseAuthorization();

var api = app.MapGroup("/api");
var me = api.MapGroup("").RequireAuthorization();

api.MapGet("/health", () => "ok");
api.MapGet("/config", () => new { allowSignup });

api.MapPost("/register", async (Login l, HttpContext http) =>
{
    if (!allowSignup) return Results.StatusCode(403);
    if (string.IsNullOrWhiteSpace(l.Name) || l.Name.Length > 60 || (l.Password ?? "").Length < 8)
        return Results.BadRequest("Name und ein Passwort mit mindestens 8 Zeichen eingeben.");
    using var db = Open();
    try { Exec(db, "INSERT INTO users (name, hash) VALUES ($a, $b)", l.Name.Trim(), Hash(l.Password!)); }
    catch (SqliteException e) when (e.SqliteErrorCode == 19) { return Results.Conflict("Name ist vergeben."); }
    var id = (long)Scalar(db, "SELECT id FROM users WHERE name = $a", l.Name.Trim())!;
    await SignIn(http, id, l.Name.Trim());
    return Results.Ok();
});

api.MapPost("/login", async (Login l, HttpContext http) =>
{
    using var db = Open();
    using var cmd = Cmd(db, "SELECT id, name, hash FROM users WHERE name = $a", l.Name ?? "");
    using var r = cmd.ExecuteReader();
    if (!r.Read() || !Verify(l.Password ?? "", r.GetString(2))) return Results.Unauthorized();
    await SignIn(http, r.GetInt64(0), r.GetString(1));
    return Results.Ok();
});

api.MapPost("/logout", async (HttpContext http) => { await http.SignOutAsync(); return Results.Ok(); });

me.MapGet("/me", (ClaimsPrincipal u) => new { name = u.Identity!.Name });

me.MapGet("/docs", (ClaimsPrincipal u) =>
{
    using var db = Open();
    using var cmd = Cmd(db, "SELECT id, json FROM docs WHERE user_id = $a", Uid(u));
    using var r = cmd.ExecuteReader();
    var list = new List<KeyValuePair<string, JsonElement>>();
    while (r.Read()) list.Add(new(r.GetString(0), JsonDocument.Parse(r.GetString(1)).RootElement));
    return Results.Ok(list.ToDictionary());
});

me.MapPut("/docs/{id}", (string id, JsonElement body, ClaimsPrincipal u) =>
{
    using var db = Open();
    Exec(db, "INSERT INTO docs (user_id, id, json) VALUES ($a, $b, $c) ON CONFLICT DO UPDATE SET json = excluded.json", Uid(u), id, body.GetRawText());
    return Results.Ok();
});

me.MapDelete("/docs/{id}", (string id, ClaimsPrincipal u) =>
{
    using var db = Open();
    Exec(db, "DELETE FROM docs WHERE user_id = $a AND id = $b", Uid(u), id);
    return Results.Ok();
});

api.MapGet("/pages/{slug}", (string slug) =>
{
    using var db = Open();
    return Scalar(db, "SELECT json FROM pages WHERE slug = $a", slug) is string json
        ? Results.Text(json, "application/json") : Results.NotFound();
});

me.MapPut("/pages/{slug:regex(^[a-z0-9-]{{1,60}}$)}", (string slug, JsonElement body, ClaimsPrincipal u) =>
{
    using var db = Open();
    var n = Exec(db, "INSERT INTO pages (slug, user_id, json) VALUES ($a, $b, $c) ON CONFLICT DO UPDATE SET json = excluded.json WHERE user_id = excluded.user_id", slug, Uid(u), body.GetRawText());
    return n == 1 ? Results.Ok() : Results.Conflict("Adresse ist vergeben.");
});

me.MapDelete("/pages/{slug}", (string slug, ClaimsPrincipal u) =>
{
    using var db = Open();
    Exec(db, "DELETE FROM pages WHERE slug = $a AND user_id = $b", slug, Uid(u));
    return Results.Ok();
});

app.Run();

SqliteConnection Open() { var c = new SqliteConnection(conn); c.Open(); return c; }
static SqliteCommand Cmd(SqliteConnection db, string sql, params object[] args)
{
    var cmd = db.CreateCommand();
    cmd.CommandText = sql;
    for (var i = 0; i < args.Length; i++) cmd.Parameters.AddWithValue("$" + (char)('a' + i), args[i]);
    return cmd;
}
static int Exec(SqliteConnection db, string sql, params object[] args) { using var c = Cmd(db, sql, args); return c.ExecuteNonQuery(); }
static object? Scalar(SqliteConnection db, string sql, params object[] args) { using var c = Cmd(db, sql, args); return c.ExecuteScalar(); }
static long Uid(ClaimsPrincipal u) => long.Parse(u.FindFirstValue(ClaimTypes.NameIdentifier)!);

static Task SignIn(HttpContext http, long id, string name) => http.SignInAsync(new ClaimsPrincipal(new ClaimsIdentity(
    [new Claim(ClaimTypes.NameIdentifier, id.ToString()), new Claim(ClaimTypes.Name, name)],
    CookieAuthenticationDefaults.AuthenticationScheme)), new AuthenticationProperties { IsPersistent = true });

static string Hash(string pw)
{
    var salt = RandomNumberGenerator.GetBytes(16);
    var key = Rfc2898DeriveBytes.Pbkdf2(pw, salt, 210_000, HashAlgorithmName.SHA256, 32);
    return $"{Convert.ToBase64String(salt)}.{Convert.ToBase64String(key)}";
}
static bool Verify(string pw, string stored)
{
    var p = stored.Split('.');
    var key = Rfc2898DeriveBytes.Pbkdf2(pw, Convert.FromBase64String(p[0]), 210_000, HashAlgorithmName.SHA256, 32);
    return CryptographicOperations.FixedTimeEquals(key, Convert.FromBase64String(p[1]));
}

record Login(string? Name, string? Password);
