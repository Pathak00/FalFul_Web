using FalFul.Application.Interfaces;
using Microsoft.SemanticKernel;
using System.ComponentModel;
using System.Text.Json;

namespace FalFul.ChatAI.Plugins;

public class FruitStorePlugin(IProductRepository productRepo)
{
    [KernelFunction("get_available_fruits")]
    [Description(
"""
Returns the whole-fruit product catalog from the database, sold by kilogram (or the
product's native unit).

Call this whenever the user asks about:
- what fruits are available
- whole-fruit prices, stock, or availability
- an order given in kg / kilograms (not grams)

Each returned product contains: name, price (per unit), unit (e.g. KG), isAvailable.
Do not use this for gram-based / cut-fruit / customized orders — use
get_cut_fruit_options and validate_cut_fruit_order for those instead.
"""
    )]
    public async Task<string> GetAvailableFruitsAsync()
    {
        var fruits = await productRepo.GetAllAsync(null, null);
        return JsonSerializer.Serialize(fruits.Select(f => new
        {
            name = f.Name,
            price = f.Price,
            unit = f.Unit,
            isAvailable = f.IsAvailable
        }));
    }

    [KernelFunction("get_cut_fruit_options")]
    [Description(
"""
Returns the cut-fruit ordering rules for each available fruit.

Call this function whenever the user asks about:
- cut fruit
- sliced fruit
- customized fruit
- fruit sold by defined unit
- minimum order quantity
- gram increments
- cut fruit pricing rules

Each returned product contains:

- name: Product name.
- isAvailable: Whether the product can currently be ordered.
- cutgramPrice: Price of the minimum allowed gram portion. This is NOT a price per gram.
- mingramportion: Minimum order quantity in grams.
- gramsteps: The required gram increment above the minimum.

Ordering rules:

1. The minimum order quantity is 'mingramportion'.

2. Valid quantities are:

   mingramportion + (N × gramsteps)

   where N is any whole number greater than or equal to 0.

3. There is NO maximum order quantity unless one is explicitly returned by the function.
   Never invent or assume a maximum quantity.

4. Never invent different gram increments.
   Always use the returned gramsteps value.

5. The effective unit price can be derived as:

   pricePerGram = cutgramPrice / mingramportion

   However, do NOT calculate prices yourself.

6. If the user asks for:
   - the total price,
   - order validation,
   - whether a quantity is valid,
   - or wants to place an order,

   ALWAYS call the 'validate_cut_fruit_order' function.

7. Never estimate prices or quantities from memory.
   Use only the values returned by this function and the validation function.
"""
)]
    public async Task<string> GetCutFruitOptionsAsync()
    {
        var fruits = await productRepo.GetAllAsync(null, null);

        return JsonSerializer.Serialize(fruits.Select(f => new
        {
            name = f.Name,
            isAvailable = f.IsAvailable,
            cutgramPrice = f.CutFruitPrice,
            mingramportion = f.MinOrderGrams,
            gramsteps = f.GramStep,
            unit = f.Unit
        }));
    }
}
