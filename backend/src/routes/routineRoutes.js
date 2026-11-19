import { Router } from "express";
import { generateRoutine, getSchedule, updateRoutineSlot, swapRoutineSlots } from "../controllers/routineController.js";

const router = Router();

router.route("/").post(generateRoutine).get(getSchedule);
router.patch("/:id/slot", updateRoutineSlot);
router.post("/:id/swaps", swapRoutineSlots);

export default router;
