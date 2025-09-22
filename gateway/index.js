import cors from "cors";
import morgan from "morgan";
import { v4 as uuidv4 } from "uuid";
import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";
import path from "node:path";
import url from "node:url";

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const PROTO_DIR = process.env.PROTO_DIR || path.join(__dirname, "..", "proto");
const TOUR_GRPC_ADDR = process.env.TOUR_GRPC_ADDR || "tour:9094";
const FOLLOW_GRPC_ADDR = process.env.FOLLOW_GRPC_ADDR || "following:9093";

// --- load protos
const tourPkgDef = protoLoader.loadSync(path.join(PROTO_DIR, "tour.proto"), { longs: String, enums: String, defaults: true });
const followingPkgDef = protoLoader.loadSync(path.join(PROTO_DIR, "following.proto"), { longs: String, enums: String, defaults: true });
const tourProto = grpc.loadPackageDefinition(tourPkgDef);
const followingProto = grpc.loadPackageDefinition(followingPkgDef);

const TourService = tourProto.tour.v1.TourService;
const FollowingService = followingProto.following.v1.FollowingService;

const tourClient = new TourService(TOUR_GRPC_ADDR, grpc.credentials.createInsecure());
const followingClient = new FollowingService(FOLLOW_GRPC_ADDR, grpc.credentials.createInsecure());

// --- middlewares
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(morgan("dev"));

// --- gRPC pass-through
app.get("/api-tours/tours", (req, res) => {
  tourClient.ListTours({}, (err, data) => {
    if (err) return res.status(502).json({ error: err.message, code: err.code });
    res.json(data);
  });
});

// --- SAGA: CreateTour → RegisterGuideActivity → compensate DeleteTour
app.post("/api-tours/tours", (req, res) => {
  const rid = uuidv4();
  const { authorId, name, description, difficulty, status = "ACTIVE", priceCents, tags = [] } = req.body || {};

  tourClient.CreateTour({ authorId, name, description, difficulty, status, priceCents, tags }, (errCreate, created) => {
    if (errCreate) return res.status(502).json({ error: "CreateTour failed", details: errCreate.message, requestId: rid });

    const tourId = created?.tour?.id;
    if (!tourId) return res.status(502).json({ error: "Missing tourId", requestId: rid });

    followingClient.RegisterGuideActivity({ guideId: authorId, tourId }, (errAct, actResp) => {
      if (errAct) {
        tourClient.DeleteTour({ id: tourId }, () => {
          return res.status(502).json({ error: "RegisterGuideActivity failed", compensated: true, requestId: rid });
        });
      } else {
        res.status(201).json({ tourId, activityId: actResp?.activityId, requestId: rid });
      }
    });
  });
});
