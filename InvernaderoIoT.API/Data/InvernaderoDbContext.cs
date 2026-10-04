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

        public DbSet<Rol> Roles { get; set; }

        public DbSet<Usuario> Usuarios { get; set; }

        public DbSet<EventoRiego> EventosRiego { get; set; }

        protected override void OnModelCreating(
            ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<Usuario>()
                .HasOne(u => u.Rol)
                .WithMany(r => r.Usuarios)
                .HasForeignKey(u => u.IdRol)
                .OnDelete(DeleteBehavior.Restrict);
        }

    }
}
