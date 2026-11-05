using System;

namespace InvernaderoIoT.API.Helpers
{
    /// <summary>
    /// Convierte entre UTC (almacenamiento) y la hora de Guatemala (presentación).
    /// Guatemala utiliza UTC-06:00.
    /// </summary>
    public static class FechaHoraGuatemala
    {
        private static readonly TimeZoneInfo ZonaHoraria =
            TimeZoneInfo.CreateCustomTimeZone(
                "America/Guatemala",
                TimeSpan.FromHours(-6),
                "Hora de Guatemala",
                "Hora de Guatemala"
            );

        public static DateTime ConvertirUtcALocal(DateTime fechaUtc)
        {
            var utc = DateTime.SpecifyKind(
                fechaUtc,
                DateTimeKind.Utc
            );

            return TimeZoneInfo.ConvertTimeFromUtc(
                utc,
                ZonaHoraria
            );
        }

        public static DateTime ConvertirLocalAUtc(DateTime fechaLocal)
        {
            var localSinZona = DateTime.SpecifyKind(
                fechaLocal,
                DateTimeKind.Unspecified
            );

            return TimeZoneInfo.ConvertTimeToUtc(
                localSinZona,
                ZonaHoraria
            );
        }
    }
}
