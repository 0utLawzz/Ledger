import { Router, type IRouter } from "express";
import healthRouter from "./health";
import clientsRouter from "./clients";
import casesRouter from "./cases";
import reportsRouter from "./reports";

const router: IRouter = Router();

router.use(healthRouter);
router.use(clientsRouter);
router.use(casesRouter);
router.use(reportsRouter);

export default router;
