import { z } from "zod"

export const locationSchema = z.object({
	code: z.number(),
	message: z.string(),
	location: z.object({
		country: z.string(),
		section: z.string(),
		region: z.string(),
		district: z.string(),
		municipality: z.string(),
		postcode: z.string(),
		longitude: z.string(),
		latitude: z.string(),
		nearby_postcodes: z.array(z.string()),
		power_supplier: z.array(
				z.object({
					name: z.string(),
					acronym: z.string(),
					type: z.string(),
					rates: z.array(z.unknown()),
					logo_url: z.string()
				})
		),
		regional_fuel_cost: z.array(
			z.object({
				gasoline: z.number(),
				diesel: z.number(),
				electricity: z.number(),
				gasoline_tax: z.number(),
				diesel_tax: z.number(),
				commercial_electricity: z.number(),
				industrial_electricity: z.number(),
				transportation_electricity: z.null(),
				alternative_fuel_premium_gasoline: z.null(),
				alternative_fuel_premium_diesel: z.null(),
				alternative_fuel_premium_lpg: z.null()
			})
		),
		regional_electricity: z.array(
			z.object({
				emissions: z.object({
					emissions_co2: z.number(),
					emissions_so2: z.number(),
					emissions_nox: z.number(),
					emissions_co2_carbon_credit_calculation: z.array(z.unknown())
				}),
				power_mix: z.object({
					coal: z.number(),
					petroleum: z.number(),
					nuclear: z.number(),
					hydro: z.number(),
					wind: z.number(),
					solar: z.number(),
					biomass: z.number(),
					other: z.number(),
					natural_gas: z.number()
				})
			})
		),
		regional_financial_references: z.array(
			z.object({
				rates: z.null(),
				sales_tax: z.object({
					region: z.number(),
					combined: z.number(),
					avg_local: z.number()
				}),
				ev_registration_fees: z.object({
					add_on_registration_fees: z.number(),
					registration_fees: z.number()
				}),
				ice_insurance_annual_premium: z.number(),
				doc_prep_fees: z.number()
			})
		),
		national_fuel_cost: z.array(
			z.object({
				gasoline: z.number(),
				diesel: z.number(),
				electricity: z.number(),
				gasoline_tax: z.number(),
				diesel_tax: z.number(),
				commercial_electricity: z.number(),
				industrial_electricity: z.number(),
				transportation_electricity: z.number()
			})
		),
		national_electricity: z.array(
			z.object({
				emissions: z.object({
					emissions_co2: z.number(),
					emissions_so2: z.number(),
					emissions_nox: z.number()
				}),
				power_mix: z.object({
					coal: z.number(),
					petroleum: z.number(),
					nuclear: z.number(),
					hydro: z.number(),
					wind: z.number(),
					solar: z.number(),
					biomass: z.number(),
					other: z.number(),
					natural_gas: z.number()
				})
			})
		),
		national_financial_references: z.array(
			z.object({
				rates: z.object({ sofr: z.number() }),
				sales_tax: z.null(),
				ev_registration_fees: z.null(),
				ice_insurance_annual_premium: z.number(),
				doc_prep_fees: z.null()
			})
		),
		carbon_credits: z.array(z.unknown()),
		ratios: z.array(
			z.object({ name: z.string(), description: z.string(), value: z.number() })
		)
	})
})
