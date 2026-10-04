using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.ComponentModel.DataAnnotations;

namespace InvernaderoIoT.API.Models
{
    public class EventoRiego
    {
        [Key]
        public int IdRiego { get; set; }

        public DateTime FechaHoraInicio { get; set; }

        public DateTime? FechaHoraFin { get; set; }

        public int? DuracionSegundos { get; set; }

        public bool ActivadoAutomaticamente { get; set; }
    }
}
