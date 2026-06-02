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
            slotIntervalMinutes   = I(4, 60),
            storeLatitude         = D(5, 27.7172),
            storeLongitude        = D(6, 85.3240),
            cutFruitRadiusKm      = D(7, 5)
        });
    }

    private static readonly Dictionary<string, string> StatDefaults = new()
    {
        ["homepage_stat_1_value"]  = "2400",
        ["homepage_stat_1_suffix"] = "+",
        ["homepage_stat_1_label"]  = "Happy Customers",
        ["homepage_stat_2_value"]  = "15",
        ["homepage_stat_2_suffix"] = "k+",
        ["homepage_stat_2_label"]  = "Orders Delivered",
        ["homepage_stat_3_value"]  = "50",
        ["homepage_stat_3_suffix"] = "+",
        ["homepage_stat_3_label"]  = "Fruit Varieties",
        ["homepage_stat_4_value"]  = "5",
        ["homepage_stat_4_suffix"] = "",
        ["homepage_stat_4_label"]  = "Cities Covered",
    };

    [HttpGet("homepage-stats")]
    public async Task<IActionResult> GetHomepageStats()
    {
        var all = (await settings.GetAllAsync())
            .ToDictionary(s => s.Key, s => s.Value);

        string Get(string key) =>
            all.TryGetValue(key, out var v) && !string.IsNullOrWhiteSpace(v)
                ? v : StatDefaults[key];

        var stats = Enumerable.Range(1, 4).Select(i => new
        {
            value  = int.TryParse(Get($"homepage_stat_{i}_value"), out var n) ? n : 0,
            suffix = Get($"homepage_stat_{i}_suffix"),
            label  = Get($"homepage_stat_{i}_label"),
        });

        return Ok(stats);
    }

    private static double Parse(string? v, double def)
        => double.TryParse(v, System.Globalization.NumberStyles.Any,
            System.Globalization.CultureInfo.InvariantCulture, out var r) ? r : def;
}
