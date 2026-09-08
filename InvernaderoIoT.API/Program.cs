using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using InvernaderoIoT.API.Data;
using Microsoft.EntityFrameworkCore;
using InvernaderoIoT.API.Data;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Hosting;




namespace InvernaderoIoT.API
{
    public class Program
    {
        public static void Main(string[] args)
        {
            CreateHostBuilder(args).Build().Run();
        }

        public static IHostBuilder CreateHostBuilder(string[] args) =>
            Host.CreateDefaultBuilder(args)
                .ConfigureWebHostDefaults(webBuilder =>
                {
                    webBuilder.UseStartup<Startup>();

                    // Permite conexiones desde otros dispositivos
                    // de la red local.
                    webBuilder.UseUrls(
                        "https://0.0.0.0:44376",
                        "http://0.0.0.0:5000"
                    );
                });
    }
}
