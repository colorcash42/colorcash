import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

admin.initializeApp();
const db = admin.firestore();

// Game configuration
const BETTING_DURATION_SECONDS = 105; // 1 minute 45 seconds for betting
const SPIN_DURATION_SECONDS = 15; // 15 seconds for spin/result
const ROUND_INTERVAL_MINUTES = 2; // Total round time

const MULTIPLIERS = [0, 2, 3, 5, 2, 0, 3, 2]; // 0 is BUST

/**
 * Creates and manages game rounds for the "Spin & Win" live game.
 * This function runs on a schedule (every 2 minutes).
 */
export const manageSpinAndWin = functions
  .runWith({ memory: "512MB", timeoutSeconds: 110 })
  .pubsub.schedule(`every ${ROUND_INTERVAL_MINUTES} minutes from 00:00 to 23:59`)
  .timeZone("UTC")
  .onRun(async (context) => {
    console.log("Starting new Spin & Win round...");

    const roundId = `round-${context.timestamp}`;
    const now = admin.firestore.Timestamp.now();
    const spinTime = admin.firestore.Timestamp.fromMillis(
      now.toMillis() + BETTING_DURATION_SECONDS * 1000,
    );
    const endTime = admin.firestore.Timestamp.fromMillis(
      spinTime.toMillis() + SPIN_DURATION_SECONDS * 1000,
    );

    const newRound = {
      id: roundId,
      status: "betting",
      startTime: now,
      spinTime: spinTime,
      endTime: endTime,
      winningMultiplier: null,
      resultTimestamp: null,
    };

    // Update the live status to start the new round
    await db.collection("liveGameStatus").doc("current").set(newRound);
    console.log(`Round ${roundId} started. Betting is open.`);

    // --- Wait for the betting period to end ---
    // We create a promise that resolves when the betting time is over.
    await new Promise((resolve) =>
      setTimeout(
        resolve,
        BETTING_DURATION_SECONDS * 1000,
      ),
    );

    // --- Start the spinning phase ---
    console.log(`Betting closed for round ${roundId}. Now spinning.`);
    await db.collection("liveGameStatus").doc("current").update({
      status: "spinning",
    });

    // --- Determine winner and process bets ---
    const winningMultiplier = MULTIPLIERS[
      Math.floor(Math.random() * MULTIPLIERS.length)
    ];
    console.log(`Winning multiplier for round ${roundId} is: ${winningMultiplier}`);

    const betsSnapshot = await db
      .collectionGroup("bets")
      .where("roundId", "==", roundId)
      .get();

    if (betsSnapshot.empty) {
      console.log("No bets were placed in this round.");
    } else {
        const batch = db.batch();

        betsSnapshot.docs.forEach((doc) => {
            const bet = doc.data();
            const userId = bet.userId;
            const amount = bet.amount;
            const userRef = db.collection("users").doc(userId);

            if (winningMultiplier > 0) {
                // It's a win
                const payout = amount * winningMultiplier;
                // Add payout to the user's balance
                batch.update(userRef, {
                    walletBalance: admin.firestore.FieldValue.increment(payout),
                });
                // Update the bet status to 'won'
                batch.update(doc.ref, { status: "won", payout: payout });
            } else {
                // It's a BUST, bet is lost
                batch.update(doc.ref, { status: "lost", payout: 0 });
            }
        });

        console.log(`Processing ${betsSnapshot.size} bets...`);
        await batch.commit();
        console.log("All bets processed and payouts distributed.");
    }


    // --- Finish the round ---
    console.log(`Finishing round ${roundId}.`);
    await db.collection("liveGameStatus").doc("current").update({
      status: "finished",
      winningMultiplier: winningMultiplier,
      resultTimestamp: admin.firestore.Timestamp.now(),
    });

    console.log(`Round ${roundId} is complete.`);
    return null;
  });

/**
 * The original helloWorld function for basic testing.
 */
export const helloWorld = functions.https.onRequest((request, response) => {
  functions.logger.info("Hello logs!", { structuredData: true });
  response.send("Hello from Firebase!");
});