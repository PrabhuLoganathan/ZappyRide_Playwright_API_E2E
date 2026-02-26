import { expect, Page } from "@playwright/test";
import { getBearerToken } from "../utils/tokenManager";

const originKey: string = 'xcel.com'

export async function getSpecificIncentives(request: {
	get: (authorization: string, origin: { headers: { authorization: string; origin: string } }) => any
}, basetest: string, postcode: string) {
	const response = await request.get(`${basetest}incentives?postcode=${postcode}&vehicle_handle=&household_size=1&household_income=75000&tax_filing_type=single&support_for=Charging station`, {
		headers: {
			'authorization': `Bearer ${await getBearerToken()}`,
			'origin': originKey,
		},
	})
	if (response.ok()) {
		const responseBody = await response.json();
		const jsonObject = JSON.parse(JSON.stringify(responseBody));
		return jsonObject.incentives
	} else {
		console.error(`Failed to GET response with status ${response.status()}`);
		return []
	}
}

export async function getLocation(request: {
	get: (authorization: string, origin: { headers: { authorization: string; origin: string } }) => any
}, basetest: string, postcode: string) {
	const response = await request.get(`${basetest}location?postcode=${postcode}`, {
		headers: {
			'authorization': `Bearer ${await getBearerToken()}`,
			'origin': originKey,
		},
	})
	if (response.ok()) {
		const responseBody = await response.json();
		const jsonObject = JSON.parse(JSON.stringify(responseBody));
		return jsonObject.location
	} else {
		console.error(`Failed to POST response with status ${response.status()}`);
		return []
	}
}

export async function getRoute(page: Page, fleet: string) {
	await page.goto(`${fleet}/output/overview`)
	await page.route(`https://api.beta.zappyride.com/location?postcode=66015`, (route) => {
		console.log("Inside GOOD site: " + fleet);
		const request = route.request();
		const method = request.method();
		const postData = request.postDataJSON();
		route.fulfill({
			status: 200,
			contentType: "application/json",
			body: "tests/evergy-location.json",
		});
		expect(request.method()).toBe("POST");
		expect(request.postDataJSON()).toEqual(
			expect.objectContaining({
				winner: expect.stringMatching(""),
				createdAt: expect.any(String),
			})
		);
	});
}

export async function getNumberOfChargers(request: {
	get: (authorization: string, origin: { headers: { authorization: string; origin: string; responseType: string } }) => any
}, basetest: string, postcode: string) {
	const response = await request.get(`https://api.beta.zappyride.com/unified-chargers?types=commercial,archetype`, {
		headers: {
			'authorization': `Bearer ${await getBearerToken()}`,
			'origin': originKey,
			'responseType': 'application/json',
		},
	})
	if (response.ok()) {
		const jsonValue = await response.json()
		let counter = 0
		for (let i = 0; i < jsonValue.chargers.length; i++) {
			const chargersData = await JSON.stringify(jsonValue.chargers[i])
			// console.log("ITEM:" + chargersData)
			counter++
		}
		return counter;
	} else {
		console.error(`Failed to GET response with status ${response.status()}`);
		return -1
	}
}

export async function getListOfChargers(request: {
	get: (authorization: string, origin: { headers: { authorization: string; origin: string; responseType: string; accept_encoding: string } }) => any
}, basetest: string, postcode: string) {
	const response = await request.get(`https://api.beta.zappyride.com/unified-chargers?types=commercial,archetype`, {
		headers: {
			'authorization': `Bearer ${await getBearerToken()}`,
			'origin': originKey,
			'responseType': 'application/json',
			'accept_encoding': 'gzip,deflate,br',
		},
	})
	if (response.ok()) {
		let jsonValue = await response.json()
		return jsonValue.chargers
	} else {
		console.error(`Failed to GET response with status ${response.status()}`);
		return -1
	}
}

// export async function getListOfIncentives(request: any, api: string,bodyPost: string, origin: string, referer: string) {
// 	const response = await request.post(`https://commercial.beta.zappyride.com/project`, {
// 		headers: {
// 			'authorization': 'Bearer 9e4b20b0031742bdda41ef9a9f2573dd',
// 			'origin': origin,
// 			'contentType': 'application/json',
// 			'Referer': referer
// 		},
// 		data: bodyPost
// 	});
//
// 	if (response.ok()) {
// 		let val = await response.json()
// 		return val.evaluations.incentives
// 	} else {
// 		console.error(`Failed to POST response with status ${response.status()}`);
// 		return -1
// 	}
// }

export async function getListIncentives(request: {
	get: (authorization: string, origin: { headers: { authorization: string; origin: string } }) => any
}, basetest: string, postcode: string, incentiveFocus: string) {
	const response = await request.get(`${basetest}commercial/incentives?postcode=${postcode}&country=US&incentive_focus=${incentiveFocus}`, {
		headers: {
			'authorization': `Bearer ${await getBearerToken()}`,
			'origin': originKey,
		},
	})
	if (response.ok()) {
		const responseBody = await response.json();
		const jsonObject = JSON.parse(JSON.stringify(responseBody));
		return jsonObject.incentives
	} else {
		console.error(`Failed to GET response with status ${response.status()}`);
		return []
	}
}

export async function getListOfProjects(request: any, api: string, bodyPost: string, domain: string) {
	const response = await request.post(`https://apigateway.beta.zappyride.com/evfleetspremium/projects?domain=dev-fleetspremium.saas.d.zappyride.com`, {
		headers: {
			'authorization': `Bearer ${await getBearerToken()}`,
			'origin': domain,
			'contentType': 'application/json',
			'Referer': domain
		},
		data: bodyPost
	});

	if (response.ok()) {
		let val = await response.json()
		return val.evaluations.incentives
	} else {
		console.error(`Failed to POST response with status ${response.status()}`);
		return -1
	}
}

export async function getListOfPremiumProjects(request: {
	get: (authorization: string, origin: { headers: { authorization: string; responseType: string; accept_encoding: string } }) => any
}, accessToken: string, domain: string) {
	const response = await request.get(`https://apigateway.beta.zappyride.com/evfleetspremium/projects?domain=${domain}`, {
		headers: {
			'authorization': 'Bearer ' + accessToken,
			'responseType': 'application/json',
			'accept_encoding': 'gzip,deflate,br',
		},
	})
	if (response.ok()) {
		let jsonValue = await response.json()
		// console.log("DATA:" + jsonValue.projects)
		const value = jsonValue.projects[0]
		console.log("VALUE: " + value.name)
		return jsonValue.projects
	} else {
		console.error(`Failed to GET response with status ${response.status()}`);
		return -1
	}
}

export async function getListOfSearchProjects(request: {
	get: (authorization: string, origin: { headers: { authorization: string; responseType: string; accept_encoding: string } }) => any
}, accessToken: string, domain: string, searchItem: string, userName: string) {
	const response = await request.get(`https://apigateway.beta.zappyride.com/evfleetspremium/projects?domain=${domain}&query_search=${searchItem}&page_size=10&page_number=1&email=${userName}`, {
		headers: {
			'authorization': 'Bearer ' + accessToken,
			'responseType': 'application/json',
			'accept_encoding': 'gzip,deflate,br',
		},
	})
	if (response.ok()) {
		let jsonValue = await response.json()
		// console.log("DATA:" + jsonValue.projects)
		const value = jsonValue.projects[0].id
		console.log("ID: " + value.name)
		return jsonValue.projects[0].id
	} else {
		console.error(`Failed to GET response with status ${response.status()}`);
		return -1
	}
}

export async function deleteProjectId(request: {
	delete: (authorization: string, origin: { headers: { authorization: string; responseType: string; accept_encoding: string } }) => any
}, accessToken: string, projectId: string) {
	const response = await request.delete(`https://apigateway.beta.zappyride.com/evfleetspremium/projects/${projectId}`, {
		headers: {
			'authorization': 'Bearer ' + accessToken,
			'responseType': 'application/json',
			'accept_encoding': 'gzip,deflate,br',
		},
	})
	if (response.ok()) {
		console.log("OK to DELETE project with ID: " + projectId)
		return "OK"
	} else {
		console.error(`Failed to DELETE response with status ${response.status()}`);
		return -1
	}
}

export async function getRates(request: {
	post: (authorization: string, origin: { headers: { authorization: string; responseType: string; accept_encoding: string } }) => any
}, accessToken: string) {
	const response = await request.post(`https://apigw.beta.zappyride.com/rates`, {
		headers: {
			'authorization': 'Bearer ' + accessToken,
			'responseType': 'application/json',
			'accept_encoding': 'gzip,deflate,br',
		},
	})
	if (response.ok()) {
		let jsonValue = await response.json()
		// console.log("DATA:" + jsonValue.projects)
		console.log("Status value: " + jsonValue.status)
		return jsonValue.status
	} else {
		console.error(`Failed to GET response with status ${response.status()}`);
		return -1
	}
}