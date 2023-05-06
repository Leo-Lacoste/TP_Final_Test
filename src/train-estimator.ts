import {
  ApiException,
  DiscountCard,
  InvalidTripInputException,
  TripRequest,
} from "./model/trip.request";

export class TrainTicketEstimator {
  async estimate(trainDetails: TripRequest): Promise<number> {
    if (trainDetails.passengers.length === 0) {
      return 0;
    }

    if (trainDetails.details.from.trim().length === 0) {
      throw new InvalidTripInputException("Start city is invalid");
    }

    if (trainDetails.details.to.trim().length === 0) {
      throw new InvalidTripInputException("Destination city is invalid");
    }

    if (
      trainDetails.details.when <
      new Date(
        new Date().getFullYear(),
        new Date().getMonth(),
        new Date().getDay(),
        0,
        0,
        0
      )
    ) {
      throw new InvalidTripInputException("Date is invalid");
    }

    // TODO USE THIS LINE AT THE END
    const initialPrice = await this.getPrices(trainDetails);

    if (initialPrice === -1) {
      throw new ApiException();
    }

    const passengers = trainDetails.passengers;
    let totalPrice = 0;
    let ticketPrice = initialPrice;
    for (let i = 0; i < passengers.length; i++) {
      if (passengers[i].age < 0) {
        throw new InvalidTripInputException("Age is invalid");
      }
      if (passengers[i].age < 1) {
        continue;
      }
      // Seniors
      else if (passengers[i].age <= 17) {
        ticketPrice = initialPrice * 0.6;
      } else if (passengers[i].age >= 70) {
        ticketPrice = initialPrice * 0.8;
        if (passengers[i].discounts.includes(DiscountCard.Senior)) {
          ticketPrice -= initialPrice * 0.2;
        }
      } else {
        ticketPrice = initialPrice * 1.2;
      }

      const currentDay = new Date();
      if (
        trainDetails.details.when.getTime() >=
        currentDay.setDate(currentDay.getDate() + 30)
      ) {
        ticketPrice -= initialPrice * 0.2;
      } else if (
        trainDetails.details.when.getTime() >
        currentDay.setDate(currentDay.getDate() - 30 + 5)
      ) {
        const travelDay = trainDetails.details.when;
        const currentDay2 = new Date();
        //https://stackoverflow.com/questions/43735678/typescript-get-diffDateerence-between-two-dates-in-days
        var diffDateMilliSecs = Math.abs(
          travelDay.getTime() - currentDay2.getTime()
        );
        var diffDateDays = Math.ceil(diffDateMilliSecs / (1000 * 3600 * 24));

        ticketPrice += (20 - diffDateDays) * 0.02 * initialPrice; // I tried. it works. I don't know why.
      } else {
        ticketPrice += initialPrice;
      }

      if (passengers[i].age > 0 && passengers[i].age < 4) {
        ticketPrice = 9;
      }

      if (passengers[i].discounts.includes(DiscountCard.TrainStroke)) {
        ticketPrice = 1;
      }

      totalPrice += ticketPrice;
      ticketPrice = initialPrice;
    }

    if (passengers.length == 2) {
      let hasCoupleCard = false;
      let isMinor = false;
      for (let i = 0; i < passengers.length; i++) {
        if (passengers[i].discounts.includes(DiscountCard.Couple)) {
          hasCoupleCard = true;
        }
        if (passengers[i].age < 18) {
          isMinor = true;
        }
      }
      if (hasCoupleCard && !isMinor) {
        totalPrice -= initialPrice * 0.2 * 2;
      }
    }

    if (passengers.length == 1) {
      let hasHalfCoupleCard = false;
      let isMinor = false;
      for (let i = 0; i < passengers.length; i++) {
        if (passengers[i].discounts.includes(DiscountCard.HalfCouple)) {
          hasHalfCoupleCard = true;
        }
        if (passengers[i].age < 18) {
          isMinor = true;
        }
      }
      if (hasHalfCoupleCard && !isMinor) {
        totalPrice -= initialPrice * 0.1;
      }
    }

    return totalPrice;
  }

  protected async getPrices(trainDetails: TripRequest) {
    return (
      (
        await (
          await fetch(
            `https://sncf.com/api/train/estimate/price?from=${trainDetails.details.from}&to=${trainDetails.details.to}&date=${trainDetails.details.when}`
          )
        ).json()
      )?.price || -1
    );
  }
}
