namespace FalFul.Domain.Common;

public class PaymentSettings
{
    public bool    AdvanceEnabled   { get; set; }
    public decimal AdvancePercent   { get; set; }   // e.g. 30 means 30%
    public decimal MinAdvanceAmount { get; set; }   // order total below this → no advance required

    /// <summary>
    /// Calculates the advance amount for a given order total.
    /// Returns 0 if advance is disabled or the total is below the minimum threshold.
    /// </summary>
    public decimal CalculateAdvance(decimal orderTotal)
    {
        if (!AdvanceEnabled || orderTotal < MinAdvanceAmount || AdvancePercent <= 0)
            return 0;

        return Math.Round(orderTotal * AdvancePercent / 100, 2);
    }
}
