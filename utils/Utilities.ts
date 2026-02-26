import {Locator} from "@playwright/test";

export class Utilities {
	/**
	 * Uses a retry pattern to wait for the locator to be visible.
	 *
	 * Only use if there is uncertainty about an element appearing,
	 * if an element is there in some environments but not others
	 * then use environment variables to determine whether or not to look for it
	 * @param {Locator} locator
	 */
	static async waitForVisibleWithoutThrowing(locator: Locator): Promise<boolean> {
		let isVisible = await this.waitUntilTrueOrTimeout(() => locator.isVisible())
		return isVisible;
	}

	static async waitUntilTrueOrTimeout(action: () => Promise<boolean>, timeout: number = 5000): Promise<boolean> {
		const maxtime = Date.now() + timeout;
		const step = 500;

		while (Date.now() < maxtime) {
			if (await action()) {
				return true;
			} else {
				await this.delay(step);
			}
		}

		return false;
	}

	private static delay(ms: number) {
		return new Promise(resolve => setTimeout(resolve, ms));
	}

	static sortList<T>(data: T[], keyToSort: keyof T, direction: 'ascending' | 'descending' | 'none') {
		if (direction === 'none') {
			return data
		}
		const compare = (objectA: T, objectB: T) => {
			const valueA = objectA[keyToSort]
			const valueB = objectB[keyToSort]

			if (valueA === valueB) {
				return 0
			}

			if (valueA > valueB) {
				return direction === 'ascending' ? 1 : -1
			} else {
				return direction === 'ascending' ? -1 : 1
			}
		}
		return data.slice().sort(compare)
	}

}

