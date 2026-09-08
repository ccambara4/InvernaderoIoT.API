using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using InvernaderoIoT.API.Models;

namespace InvernaderoIoT.API.Data
{
    public class InvernaderoDbContext : DbContext
    {
        public InvernaderoDbContext(
            DbContextOptions<InvernaderoDbContext> options)
            : base(options)
        {
        }

        public DbSet<LecturaAmbiental> LecturasAmbientales { get; set; }
       
    }
}
