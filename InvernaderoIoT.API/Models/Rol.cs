using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.ComponentModel.DataAnnotations;

namespace InvernaderoIoT.API.Models
{
    public class Rol
    {
        [Key]
        public int IdRol { get; set; }

        public string NombreRol { get; set; }

        public ICollection<Usuario> Usuarios { get; set; }
    }
}
