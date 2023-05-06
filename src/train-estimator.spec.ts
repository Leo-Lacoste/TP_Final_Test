import {
  ApiException,
  DiscountCard,
  InvalidTripInputException,
  Passenger,
  TripDetails,
  TripRequest,
} from "./model/trip.request";
import { TrainTicketEstimator } from "./train-estimator";

describe("train estimator", function () {
  let trainTicketEstimator: TrainTicketEstimator;
  let tripDetails: TripDetails;
  let tripRequest: TripRequest;

  function getDateDecalee(nbreJours: number): Date {
    const date = new Date();
    date.setDate(date.getDate() + nbreJours);
    return date;
  }

  beforeEach(() => {
    trainTicketEstimator = new TrainTicketEstimator();
  });

  it("should return 0 if we have no passengers", async function () {
    tripDetails = new TripDetails("Paris", "Toulouse", getDateDecalee(2));
    tripRequest = new TripRequest(tripDetails, []);

    const result = await trainTicketEstimator.estimate(tripRequest);

    expect(result).toBe(0);
  });

  it("should throw an exception if the start city is not valid", async function () {
    tripDetails = new TripDetails("", "", new Date());
    tripRequest = new TripRequest(tripDetails, [new Passenger(2, [])]);
    await expect(
      async () => await trainTicketEstimator.estimate(tripRequest)
    ).rejects.toEqual(new InvalidTripInputException("Start city is invalid"));
  });

  it("should throw an exception if the destination city is not valid", async function () {
    tripDetails = new TripDetails("Bordeaux", "", new Date());
    tripRequest = new TripRequest(tripDetails, [new Passenger(2, [])]);
    await expect(
      async () => await trainTicketEstimator.estimate(tripRequest)
    ).rejects.toEqual(
      new InvalidTripInputException("Destination city is invalid")
    );
  });

  it("should throw an exception if date is not valid", async function () {
    tripDetails = new TripDetails("Bordeaux", "Paris", new Date(2022, 1, 13));
    tripRequest = new TripRequest(tripDetails, [new Passenger(2, [])]);
    await expect(
      async () => await trainTicketEstimator.estimate(tripRequest)
    ).rejects.toEqual(new InvalidTripInputException("Date is invalid"));
  });

  class FakeTrainTicketEstimatorFailedCallApi extends TrainTicketEstimator {
    protected async getPrices(trainDetails: TripRequest) {
      throw new ApiException();
    }
  }

  it("should throw an exception when call SNCF API", async function () {
    const fakeTrainTicketEstimatorFailedCallApi: FakeTrainTicketEstimatorFailedCallApi =
      new FakeTrainTicketEstimatorFailedCallApi();
    tripDetails = new TripDetails("Bordeaux", "Paris", getDateDecalee(35));
    tripRequest = new TripRequest(tripDetails, [new Passenger(2, [])]);
    await expect(
      async () =>
        await fakeTrainTicketEstimatorFailedCallApi.estimate(tripRequest)
    ).rejects.toBeInstanceOf(ApiException);
  });

  class FakeTrainTicketEstimator extends TrainTicketEstimator {
    protected async getPrices(trainDetails: TripRequest) {
      return 100;
    }
  }

  it("should throw an exception when age is not valid (< 0)", async function () {
    const fakeTrainTicketEstimator: FakeTrainTicketEstimator =
      new FakeTrainTicketEstimator();
    tripDetails = new TripDetails("Bordeaux", "Paris", getDateDecalee(35));
    tripRequest = new TripRequest(tripDetails, [new Passenger(-1, [])]);
    await expect(
      async () => await fakeTrainTicketEstimator.estimate(tripRequest)
    ).rejects.toEqual(new InvalidTripInputException("Age is invalid"));
  });

  it("should return 0 when passenger age under 1 ", async function () {
    const fakeTrainTicketEstimator: FakeTrainTicketEstimator =
      new FakeTrainTicketEstimator();
    tripDetails = new TripDetails("Bordeaux", "Paris", getDateDecalee(35));
    tripRequest = new TripRequest(tripDetails, [new Passenger(0.5, [])]);
    const result = await fakeTrainTicketEstimator.estimate(tripRequest);

    expect(result).toBe(0);
  });

  it("should return a total 9 when passenger age under 3", async function () {
    const fakeTrainTicketEstimator: FakeTrainTicketEstimator =
      new FakeTrainTicketEstimator();
    tripDetails = new TripDetails("Bordeaux", "Paris", getDateDecalee(35));
    tripRequest = new TripRequest(tripDetails, [new Passenger(3, [])]);
    const result = await fakeTrainTicketEstimator.estimate(tripRequest);

    expect(result).toBe(9);
  });

  it("should return a total 40 when passenger age between 3-17 and more than 30 days before travel", async function () {
    const fakeTrainTicketEstimator: FakeTrainTicketEstimator =
      new FakeTrainTicketEstimator();
    tripDetails = new TripDetails("Bordeaux", "Paris", getDateDecalee(35));
    tripRequest = new TripRequest(tripDetails, [new Passenger(15, [])]);
    const result = await fakeTrainTicketEstimator.estimate(tripRequest);

    expect(result).toBe(40);
  });

  it("should return a total 60 when passenger age over 70 and more than 30 days before travel", async function () {
    const fakeTrainTicketEstimator: FakeTrainTicketEstimator =
      new FakeTrainTicketEstimator();
    tripDetails = new TripDetails("Bordeaux", "Paris", getDateDecalee(35));
    tripRequest = new TripRequest(tripDetails, [new Passenger(70, [])]);
    const result = await fakeTrainTicketEstimator.estimate(tripRequest);

    expect(result).toBe(60);
  });

  it("should return a total 100 when passenger age is 43 and more than 30 days before travel", async function () {
    const fakeTrainTicketEstimator: FakeTrainTicketEstimator =
      new FakeTrainTicketEstimator();
    tripDetails = new TripDetails("Bordeaux", "Paris", getDateDecalee(35));
    tripRequest = new TripRequest(tripDetails, [new Passenger(43, [])]);
    const result = await fakeTrainTicketEstimator.estimate(tripRequest);

    expect(result).toBe(100);
  });

  it("should return a total 102 when passenger age is 43 and travel has been in 29 days", async function () {
    const fakeTrainTicketEstimator: FakeTrainTicketEstimator =
      new FakeTrainTicketEstimator();
    tripDetails = new TripDetails("Bordeaux", "Paris", getDateDecalee(29));
    tripRequest = new TripRequest(tripDetails, [new Passenger(43, [])]);
    const result = await fakeTrainTicketEstimator.estimate(tripRequest);

    expect(result).toBe(102);
  });

  it("should return a total 106 when passenger age over 70 and travel has been in 29 days", async function () {
    const fakeTrainTicketEstimator: FakeTrainTicketEstimator =
      new FakeTrainTicketEstimator();
    tripDetails = new TripDetails("Bordeaux", "Paris", getDateDecalee(7));
    tripRequest = new TripRequest(tripDetails, [new Passenger(80, [])]);
    const result = await fakeTrainTicketEstimator.estimate(tripRequest);

    expect(result).toBe(106);
  });

  it("should return a total 180 when passenger age over 70 and travel has been in 4 days", async function () {
    const fakeTrainTicketEstimator: FakeTrainTicketEstimator =
      new FakeTrainTicketEstimator();
    tripDetails = new TripDetails("Bordeaux", "Paris", getDateDecalee(4));
    tripRequest = new TripRequest(tripDetails, [new Passenger(80, [])]);
    const result = await fakeTrainTicketEstimator.estimate(tripRequest);

    expect(result).toBe(180);
  });

  it("should return a total 1 when passenger have TrainStroke staff card", async function () {
    const fakeTrainTicketEstimator: FakeTrainTicketEstimator =
      new FakeTrainTicketEstimator();
    tripDetails = new TripDetails("Bordeaux", "Paris", getDateDecalee(4));
    tripRequest = new TripRequest(tripDetails, [
      new Passenger(34, [DiscountCard.TrainStroke]),
    ]);
    const result = await fakeTrainTicketEstimator.estimate(tripRequest);

    expect(result).toBe(1);
  });

  it("should return a total 160 when passenger age over 70 and travel has been in 4 days and got Senior Card", async function () {
    const fakeTrainTicketEstimator: FakeTrainTicketEstimator =
      new FakeTrainTicketEstimator();
    tripDetails = new TripDetails("Bordeaux", "Paris", getDateDecalee(4));
    tripRequest = new TripRequest(tripDetails, [
      new Passenger(75, [DiscountCard.Senior]),
    ]);
    const result = await fakeTrainTicketEstimator.estimate(tripRequest);

    expect(result).toBe(160);
  });

  it("should return a total 220 when passenger age under 70 and travel has been in 4 days and got Senior Card", async function () {
    const fakeTrainTicketEstimator: FakeTrainTicketEstimator =
      new FakeTrainTicketEstimator();
    tripDetails = new TripDetails("Bordeaux", "Paris", getDateDecalee(4));
    tripRequest = new TripRequest(tripDetails, [
      new Passenger(53, [DiscountCard.Senior]),
    ]);
    const result = await fakeTrainTicketEstimator.estimate(tripRequest);

    expect(result).toBe(220);
  });

  it("should return a total 400 when 2 passengers age over 18 and travel has been in 4 days and got each Couple Card", async function () {
    const fakeTrainTicketEstimator: FakeTrainTicketEstimator =
      new FakeTrainTicketEstimator();
    tripDetails = new TripDetails("Bordeaux", "Paris", getDateDecalee(4));
    tripRequest = new TripRequest(tripDetails, [
      new Passenger(25, [DiscountCard.Couple]),
      new Passenger(32, [DiscountCard.Couple]),
    ]);
    const result = await fakeTrainTicketEstimator.estimate(tripRequest);

    expect(result).toBe(400);
  });

  it("should return a total 400 when 2 passengers age over 18 and travel has been in 4 days and got one Couple Card", async function () {
    const fakeTrainTicketEstimator: FakeTrainTicketEstimator =
      new FakeTrainTicketEstimator();
    tripDetails = new TripDetails("Bordeaux", "Paris", getDateDecalee(4));
    tripRequest = new TripRequest(tripDetails, [
      new Passenger(25, [DiscountCard.Couple]),
      new Passenger(32, []),
    ]);
    const result = await fakeTrainTicketEstimator.estimate(tripRequest);

    expect(result).toBe(400);
  });

  it("should return a total 380 when 1 passenger age over 18 with 1 minor and travel has been in 4 days and got one Couple Card", async function () {
    const fakeTrainTicketEstimator: FakeTrainTicketEstimator =
      new FakeTrainTicketEstimator();
    tripDetails = new TripDetails("Bordeaux", "Paris", getDateDecalee(4));
    tripRequest = new TripRequest(tripDetails, [
      new Passenger(25, [DiscountCard.Couple]),
      new Passenger(15, []),
    ]);
    const result = await fakeTrainTicketEstimator.estimate(tripRequest);

    expect(result).toBe(380);
  });

  it("should return a total 210 when 1 passenger age over 18 and travel has been in 4 days and got one Half-Couple Card", async function () {
    const fakeTrainTicketEstimator: FakeTrainTicketEstimator =
      new FakeTrainTicketEstimator();
    tripDetails = new TripDetails("Bordeaux", "Paris", getDateDecalee(4));
    tripRequest = new TripRequest(tripDetails, [
      new Passenger(25, [DiscountCard.HalfCouple]),
    ]);
    const result = await fakeTrainTicketEstimator.estimate(tripRequest);

    expect(result).toBe(210);
  });

  it("should return a total 40 when 2 senior passengers and travel has been in 36 days and got one Couple Card and Senior Card each", async function () {
    const fakeTrainTicketEstimator: FakeTrainTicketEstimator =
      new FakeTrainTicketEstimator();
    tripDetails = new TripDetails("Bordeaux", "Paris", getDateDecalee(36));
    tripRequest = new TripRequest(tripDetails, [
      new Passenger(76, [DiscountCard.Senior]),
      new Passenger(82, [DiscountCard.Senior, DiscountCard.Couple]),
    ]);
    const result = await fakeTrainTicketEstimator.estimate(tripRequest);

    expect(result).toBe(40);
  });

  it("should return a total 61 when 2 major passengers and travel has been in 36 days and got one Couple Card and one TrainStroke staff Card", async function () {
    const fakeTrainTicketEstimator: FakeTrainTicketEstimator =
      new FakeTrainTicketEstimator();
    tripDetails = new TripDetails("Bordeaux", "Paris", getDateDecalee(36));
    tripRequest = new TripRequest(tripDetails, [
      new Passenger(25, [DiscountCard.TrainStroke]),
      new Passenger(27, [DiscountCard.Couple]),
    ]);
    const result = await fakeTrainTicketEstimator.estimate(tripRequest);

    expect(result).toBe(61);
  });

  it("should return a total 200 with these conditions : \
        - travel has been in 36 days \
        - 1 passenger senior with Senior Card\
        - 1 passenger senior with Couple Card\
        - 1 passenger major with HalfCouple Card ", async function () {
    const fakeTrainTicketEstimator: FakeTrainTicketEstimator =
      new FakeTrainTicketEstimator();
    tripDetails = new TripDetails("Bordeaux", "Paris", getDateDecalee(36));
    tripRequest = new TripRequest(tripDetails, [
      new Passenger(82, [DiscountCard.Senior]),
      new Passenger(75, [DiscountCard.Couple]),
      new Passenger(22, [DiscountCard.HalfCouple]),
    ]);
    const result = await fakeTrainTicketEstimator.estimate(tripRequest);

    expect(result).toBe(200);
  });
});
