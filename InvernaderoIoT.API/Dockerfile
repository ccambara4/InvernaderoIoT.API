# Etapa 1: Compilación de la API
FROM mcr.microsoft.com/dotnet/sdk:5.0 AS build
WORKDIR /src

# Copiar el proyecto
COPY ["InvernaderoIoT.API.csproj", "./"]

# Restaurar paquetes
RUN dotnet restore "InvernaderoIoT.API.csproj"

# Copiar el resto del código
COPY . .

# Compilar y publicar
RUN dotnet publish "InvernaderoIoT.API.csproj" \
    -c Release \
    -o /app/publish \
    --no-restore

# Etapa 2: Ejecución
FROM mcr.microsoft.com/dotnet/aspnet:5.0 AS final
WORKDIR /app

COPY --from=build /app/publish .

# Puerto HTTP del contenedor
ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080

ENTRYPOINT ["dotnet", "InvernaderoIoT.API.dll"]