import { Router } from "express";

export const webhookRouter = Router();

webhookRouter.post("/github", async (req, res) => {
  const body = req.body;
  console.log(body);
  res.send("ok");
});
