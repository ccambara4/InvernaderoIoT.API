using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.ComponentModel.DataAnnotations;

namespace InvernaderoIoT.API.Models
{
    public class Usuario
    {
        [Key]
        public int IdUsuario { get; set; }

        public string Nombre { get; set; }

        public string UsuarioNombre { get; set; }

        public string PasswordHash { get; set; }

        public int IdRol { get; set; }

        public bool Activo { get; set; }

        public Rol Rol { get; set; }
    }
}
