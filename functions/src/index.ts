
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

admin.initializeApp();
const db = admin.firestore();

// Game configuration
const ROUND_INTERVAL_MINUTES = 2; // Total round time
const BETTING_DURATION_SECONDS = 105; // Betting time (must be less than ROUND_INTERVAL_MINUTES * 60)
const MULTIPLIERS = [0, 2, 3, 5, 2, 0, 3, 2]; // 0 is BUST

/**
 * Manages game rounds for "Spin & Win".
 * This function runs every 2 minutes.
 * In each run, it will:
 * 1. Process results for the *previous* round (if it was in 'betting' state).
 * 2. Start a *new* round for players to bet on.
 */
export const manageSpinAndWin = functions
  .runWith({ memory: "512MB", timeoutSeconds: 55 })
  .pubsub.schedule(`every ${ROUND_INTERVAL_MINUTES} minutes from 00:00 to 23:59`)
  .timeZone("UTC")
  .onRun(async (context) => {
    const now = admin.firestore.Timestamp.now();
    const liveStatusRef = db.collection("liveGameStatus").doc("current");

    const batch = db.batch();

    // --- 1. Process Previous Round (if it exists and was betting) ---
    // We get the document *before* starting the new round.
    const previousRoundDoc = await liveStatusRef.get();
    if (previousRoundDoc.exists) {
      const previousRound = previousRoundDoc.data();

      // Only process if the round was in the 'betting' state.
      // This prevents processing a round that was already 'finished'.
      if (previousRound && previousRound.status === "betting") {
        const roundId = previousRound.id;
        console.log(`Processing results for round ${roundId}...`);

        // Determine winner and process bets
        const winningMultiplier = MULTIPLIERS[Math.floor(Math.random() * MULTIPLIERS.length)];
        console.log(`Winning multiplier for round ${roundId} is: ${winningMultiplier}`);

        // Update the round to 'finished' state. We will update the same doc ref later.
        batch.update(liveStatusRef, {
          status: "finished",
          winningMultiplier: winningMultiplier,
          resultTimestamp: now,
        });

        const betsSnapshot = await db
          .collection("bets")
          .where("roundId", "==", roundId)
          .get();

        if (betsSnapshot.empty) {
          console.log(`No bets were placed in round ${roundId}.`);
        } else {
          const userPayouts = new Map<string, number>();

          betsSnapshot.docs.forEach((doc) => {
            const bet = doc.data();
            const userId = bet.userId;
            const amount = bet.amount;

            if (winningMultiplier > 0) {
              const payout = amount * winningMultiplier;
              userPayouts.set(userId, (userPayouts.get(userId) || 0) + payout);
              batch.update(doc.ref, { status: "won", payout: payout, outcome: "win" });
            } else {
              batch.update(doc.ref, { status: "lost", payout: 0, outcome: "loss" });
            }
          });

          // Apply payouts to user balances
          for (const [userId, totalPayout] of userPayouts.entries()) {
             const userRef = db.collection("users").doc(userId);
             batch.update(userRef, {
                walletBalance: admin.firestore.FieldValue.increment(totalPayout),
             });
          }

          console.log(`Processing ${betsSnapshot.size} bets for round ${roundId}...`);
        }
      }
    }

    // --- 2. Start a New Round ---
    // This will overwrite the 'finished' state of the previous round with the new one.
    const newRoundId = `round-${context.timestamp || now.toMillis()}`;
    console.log(`Starting new Spin & Win round: ${newRoundId}`);

    const spinTime = admin.firestore.Timestamp.fromMillis(
      now.toMillis() + BETTING_DURATION_SECONDS * 1000,
    );
    const endTime = admin.firestore.Timestamp.fromMillis(
        now.toMillis() + ROUND_INTERVAL_MINUTES * 60 * 1000,
    );

    const newRound = {
      id: newRoundId,
      status: "betting",
      startTime: now,
      spinTime: spinTime,
      endTime: endTime,
      winningMultiplier: null,
      resultTimestamp: null,
    };

    // Set the new round details, overwriting the old one.
    batch.set(liveStatusRef, newRound);

    // Commit all batched writes together.
    await batch.commit();

    console.log(`Round ${newRoundId} started. Betting is open.`);
    return null;
  });

/**
 * The original helloWorld function for basic testing.
 */
export const helloWorld = functions.https.onRequest((request, response) => {
  functions.logger.info("Hello logs!", { structuredData: true });
  response.send("Hello from Firebase!");
});
