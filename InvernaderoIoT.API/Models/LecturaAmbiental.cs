using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.ComponentModel.DataAnnotations;

namespace InvernaderoIoT.API.Models
{
    public class LecturaAmbiental
    {
        [Key]
        public int IdLectura { get; set; }

        public DateTime FechaHora { get; set; }

        public decimal? Temperatura { get; set; }

        public decimal? HumedadAmbiental { get; set; }

        public int? HumedadSuelo { get; set; }

    }
}
