import {
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
    tripDetails = new TripDetails("Bordeaux", "Paris", new Date("01/02/2022"));
    tripRequest = new TripRequest(tripDetails, [new Passenger(2, [])]);
    await expect(
      async () => await trainTicketEstimator.estimate(tripRequest)
    ).rejects.toEqual(new InvalidTripInputException("Date is invalid"));
  });
});
