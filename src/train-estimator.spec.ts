import {
  ApiException,
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

  beforeEach(() => {
    trainTicketEstimator = new TrainTicketEstimator();
  });

  it("should return 0 if we have no passengers", async function () {
    tripDetails = new TripDetails("", "", new Date());
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
    tripDetails = new TripDetails("Bordeaux", "Paris", new Date(2023, 7, 1));
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
    tripDetails = new TripDetails("Bordeaux", "Paris", new Date(2023, 7, 1));
    tripRequest = new TripRequest(tripDetails, [new Passenger(-1, [])]);
    await expect(
      async () => await fakeTrainTicketEstimator.estimate(tripRequest)
    ).rejects.toEqual(new InvalidTripInputException("Age is invalid"));
  });

  it("should return 0 when passenger age under 1 ", async function () {
    const fakeTrainTicketEstimator: FakeTrainTicketEstimator =
      new FakeTrainTicketEstimator();
    tripDetails = new TripDetails("Bordeaux", "Paris", new Date(2023, 7, 1));
    tripRequest = new TripRequest(tripDetails, [new Passenger(0.5, [])]);
    const result = await fakeTrainTicketEstimator.estimate(tripRequest);

    expect(result).toBe(0);
  });

  it("should return a total 9 when passenger age under 3", async function () {
    const fakeTrainTicketEstimator: FakeTrainTicketEstimator =
      new FakeTrainTicketEstimator();
    tripDetails = new TripDetails("Bordeaux", "Paris", new Date(2023, 7, 1));
    tripRequest = new TripRequest(tripDetails, [new Passenger(3, [])]);
    const result = await fakeTrainTicketEstimator.estimate(tripRequest);

    expect(result).toBe(9);
  });

  it("should return a total 40 when passenger age between 3-17 and more than 30 days before travel", async function () {
    const fakeTrainTicketEstimator: FakeTrainTicketEstimator =
      new FakeTrainTicketEstimator();
    tripDetails = new TripDetails("Bordeaux", "Paris", new Date(2023, 7, 1));
    tripRequest = new TripRequest(tripDetails, [new Passenger(15, [])]);
    const result = await fakeTrainTicketEstimator.estimate(tripRequest);

    expect(result).toBe(40);
  });

  it("should return a total 60 when passenger age over 70 and more than 30 days before travel", async function () {
    const fakeTrainTicketEstimator: FakeTrainTicketEstimator =
      new FakeTrainTicketEstimator();
    tripDetails = new TripDetails("Bordeaux", "Paris", new Date(2023, 7, 1));
    tripRequest = new TripRequest(tripDetails, [new Passenger(70, [])]);
    const result = await fakeTrainTicketEstimator.estimate(tripRequest);

    expect(result).toBe(60);
  });

  it("should return a total 100 when passenger age is 43 and more than 30 days before travel", async function () {
    const fakeTrainTicketEstimator: FakeTrainTicketEstimator =
      new FakeTrainTicketEstimator();
    tripDetails = new TripDetails("Bordeaux", "Paris", new Date(2023, 7, 1));
    tripRequest = new TripRequest(tripDetails, [new Passenger(43, [])]);
    const result = await fakeTrainTicketEstimator.estimate(tripRequest);

    expect(result).toBe(100);
  });
});
