FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
COPY src/Mappe/Mappe.csproj src/Mappe/
RUN dotnet restore src/Mappe/Mappe.csproj
COPY src/ src/
RUN dotnet publish src/Mappe/Mappe.csproj -c Release -o /app --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:10.0
WORKDIR /app
COPY --from=build /app .
COPY prototype/ wwwroot/
ENV ASPNETCORE_HTTP_PORTS=8080 \
    Mappe__DataDir=/data
RUN mkdir /data && chown app /data
USER app
VOLUME /data
EXPOSE 8080
ENTRYPOINT ["dotnet", "Mappe.dll"]
