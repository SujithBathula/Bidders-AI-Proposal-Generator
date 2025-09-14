// routes/proposals.js
const express = require("express");
const ProposalController = require("../controllers/proposalController");
const { authenticateUser, proposalRateLimit } = require("../middleware/auth");

const router = express.Router();

// Protected routes with JWT authentication and rate limiting
router.post(
  "/generate",
  authenticateUser,
  proposalRateLimit,
  ProposalController.generateProposal
);
router.get(
  "/my-proposals",
  authenticateUser,
  ProposalController.getMyProposals
);
router.put("/:id", authenticateUser, ProposalController.updateProposal);
router.post("/:id/submit", authenticateUser, ProposalController.submitProposal);

// Download proposal with subscription check
router.post("/:id/download", authenticateUser, ProposalController.downloadProposal);

module.exports = router;
