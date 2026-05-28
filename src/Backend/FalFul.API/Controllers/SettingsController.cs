using FalFul.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace FalFul.API.Controllers;

[ApiController]
[Route("api/settings")]
public class SettingsController(IAppSettingService settings) : ControllerBase
{
    [HttpGet("{key}")]
    public async Task<IActionResult> GetByKey(string key)
    {
        var value = await settings.GetValueAsync(key);
        return value is null ? NotFound() : Ok(new { key, value });
    }

    /// <summary>
    /// Returns all checkout-relevant config in one call (public, no auth required).
    /// Frontend uses this to generate time slots, enforce lead times, and validate cut-fruit radius.
    /// </summary>
    [HttpGet("checkout-config")]
    public async Task<IActionResult> GetCheckoutConfig()
    {
        var keys = new[]
        {
            "order_lead_time_hours", "cut_fruit_lead_time_hours",
            "delivery_slot_start_hour", "delivery_slot_end_hour", "slot_interval_minutes",
            "store_latitude", "store_longitude", "cut_fruit_delivery_radius_km"
        };

        var values = await Task.WhenAll(keys.Select(k => settings.GetValueAsync(k)));

        double D(int i, double def) => Parse(values[i], def);
        int    I(int i, int    def) => (int)Parse(values[i], def);

        return Ok(new
        {
            leadTimeHours         = D(0, 2),
            cutFruitLeadTimeHours = D(1, 1),
            slotStartHour         = I(2, 9),
            slotEndHour           = I(3, 21),
            slotIntervalMinutes   = I(4, 180),
            storeLatitude         = D(5, 27.7172),
            storeLongitude        = D(6, 85.3240),
            cutFruitRadiusKm      = D(7, 5)
        });
    }

    private static double Parse(string? v, double def)
        => double.TryParse(v, System.Globalization.NumberStyles.Any,
            System.Globalization.CultureInfo.InvariantCulture, out var r) ? r : def;
}
