import { Router, type IRouter } from "express";
import healthRouter from "./health";
import clientsRouter from "./clients";
import casesRouter from "./cases";
import reportsRouter from "./reports";
import ratesRouter from "./rates";

const router: IRouter = Router();

router.use(healthRouter);
router.use(clientsRouter);
router.use(casesRouter);
router.use(reportsRouter);
router.use(ratesRouter);

export default router;
