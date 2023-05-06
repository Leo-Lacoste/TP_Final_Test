import {
  ApiException,
  DiscountCard,
  InvalidTripInputException,
  TripRequest,
} from "./model/trip.request";

export class TrainTicketEstimator {
  static readonly DISCOUNT_20_PERCENT = 0.2;
  static readonly INCREASE_20_PERCENT = 0.2;
  static readonly DISCOUNT_40_PERCENT = 0.4;
  static readonly DISCOUNT_10_PERCENT = 0.1;
  static readonly TICKET_PRICE_9_EUR = 9;
  static readonly TICKET_PRICE_1_EUR = 1;
  static readonly DISCOUNT_2_PERCENT = 0.02;

  async estimate(trainDetails: TripRequest): Promise<number> {
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

    if (trainDetails.passengers.length === 0) {
      return 0;
    }

    const initialPrice = await this.getPrices(trainDetails);

    if (initialPrice === -1) {
      throw new ApiException();
    }

    const passengers = trainDetails.passengers;
    let totalPrice = 0;
    let ticketPrice = initialPrice;
    let hasCoupleCard = false;
    let hasHalfCoupleCard = false;
    let isMinor = false;
    for (let i = 0; i < passengers.length; i++) {
      if (passengers[i].age < 0) {
        throw new InvalidTripInputException("Age is invalid");
      }
      if (isNewBornPassenger(passengers[i].age)) {
        continue;
      } else
        ticketPrice = computeTicketAccordingAge(
          passengers,
          i,
          ticketPrice,
          initialPrice
        );

      ticketPrice = computeTicketPriceAccordingToDate(
        trainDetails,
        ticketPrice,
        initialPrice
      );

      if (isBabyPassenger(passengers[i].age)) {
        ticketPrice = TrainTicketEstimator.TICKET_PRICE_9_EUR;
      }

      if (passengers[i].discounts.includes(DiscountCard.TrainStroke)) {
        ticketPrice = TrainTicketEstimator.TICKET_PRICE_1_EUR;
      }

      totalPrice += ticketPrice;
      ticketPrice = initialPrice;

      if (passengers[i].age < 18) {
        isMinor = true;
      }

      if (passengers.length == 2) {
        if (passengers[i].discounts.includes(DiscountCard.Couple)) {
          hasCoupleCard = true;
        }
      }

      if (passengers.length == 1) {
        if (passengers[i].discounts.includes(DiscountCard.HalfCouple)) {
          hasHalfCoupleCard = true;
        }
      }
    }

    if (hasCoupleCard && !isMinor) {
      totalPrice -= initialPrice * TrainTicketEstimator.DISCOUNT_20_PERCENT * 2;
    }

    if (hasHalfCoupleCard && !isMinor) {
      totalPrice -= initialPrice * TrainTicketEstimator.DISCOUNT_10_PERCENT;
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

function computeTicketAccordingAge(
  passengers: import("/Users/leolacoste/Documents/YnovM2/Methodologie de tests/TP_Final/src/model/trip.request").Passenger[],
  i: number,
  ticketPrice: any,
  initialPrice: any
) {
  if (isMinorPassenger(passengers[i].age)) {
    ticketPrice -= initialPrice * TrainTicketEstimator.DISCOUNT_40_PERCENT;
  } else if (isSeniorPassenger(passengers[i].age)) {
    ticketPrice -= initialPrice * TrainTicketEstimator.DISCOUNT_20_PERCENT;
    if (passengers[i].discounts.includes(DiscountCard.Senior)) {
      ticketPrice -= initialPrice * TrainTicketEstimator.DISCOUNT_20_PERCENT;
    }
  } else {
    ticketPrice += initialPrice * TrainTicketEstimator.INCREASE_20_PERCENT;
  }
  return ticketPrice;
}

function isNewBornPassenger(age: number) {
  return age < 1;
}

function isBabyPassenger(age: number) {
  return age > 0 && age < 4;
}

function isMinorPassenger(age: number) {
  return age <= 17;
}

function isSeniorPassenger(age: number) {
  return age >= 70;
}
function computeTicketPriceAccordingToDate(
  trainDetails: TripRequest,
  ticketPrice: any,
  initialPrice: any
) {
  const currentDay = new Date();
  const travelDay = trainDetails.details.when;
  var diffDateDays = computeDiffDateDays(currentDay, travelDay);

  if (diffDateDays >= 30) {
    ticketPrice -= initialPrice * TrainTicketEstimator.DISCOUNT_20_PERCENT;
  } else if (diffDateDays > 5) {
    ticketPrice +=
      (20 - diffDateDays) *
      TrainTicketEstimator.DISCOUNT_2_PERCENT *
      initialPrice;
  } else {
    ticketPrice += initialPrice;
  }
  return ticketPrice;
}

function computeDiffDateDays(previousDate: Date, lateDate: Date): number {
  //https://stackoverflow.com/questions/43735678/typescript-get-diffDateerence-between-two-dates-in-days
  var diffDateMilliSecs = Math.abs(previousDate.getTime() - lateDate.getTime());
  var diffDateDays = Math.ceil(diffDateMilliSecs / (1000 * 3600 * 24));
  return diffDateDays;
}
