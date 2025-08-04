import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

admin.initializeApp();
const db = admin.firestore();

// Game configuration
const ROUND_INTERVAL_MINUTES = 2; // Total round time
const BETTING_DURATION_SECONDS = 105; // Betting time (must be less than ROUND_INTERVAL_MINUTES * 60)
const MULTIPLIERS = [0, 2, 3, 5, 2, 0, 3, 2, 5, 2, 0]; // 0 is BUST

/**
 * Manages game rounds for "Spin & Win".
 * This function runs every 2 minutes.
 * In each run, it will:
 * 1. Process results for the *previous* round (if it was in 'betting' or 'spinning' state).
 * 2. Start a *new* round for players to bet on.
 */
export const manageSpinAndWin = functions
  .runWith({ memory: "512MB", timeoutSeconds: 120 })
  .pubsub.schedule(`every ${ROUND_INTERVAL_MINUTES} minutes from 00:00 to 23:59`)
  .timeZone("UTC")
  .onRun(async (context) => {
    const now = admin.firestore.Timestamp.now();
    const liveStatusRef = db.collection("liveGameStatus").doc("current");
    const batch = db.batch();
    
    functions.logger.info(`Function executed at: ${context.timestamp}`);

    try {
        // --- 1. Process Previous Round (if it exists) ---
        const previousRoundDoc = await liveStatusRef.get();
        if (previousRoundDoc.exists) {
            const previousRound = previousRoundDoc.data();
            
            // Only process if the round was in 'betting' or 'spinning' state.
            // A 'finished' round means it's already processed.
            if (previousRound && (previousRound.status === "betting" || previousRound.status === "spinning")) {
                const roundId = previousRound.id;
                functions.logger.info(`Processing results for round ${roundId}...`);

                const winningMultiplier = MULTIPLIERS[Math.floor(Math.random() * MULTIPLIERS.length)];
                functions.logger.info(`Winning multiplier for round ${roundId} is: ${winningMultiplier}`);
                
                batch.update(liveStatusRef, {
                    status: "finished",
                    winningMultiplier: winningMultiplier,
                    resultTimestamp: now,
                });

                // Use a collection group query to get all bets for the round
                const betsSnapshot = await db
                    .collectionGroup("bets")
                    .where("roundId", "==", roundId)
                    .get();

                if (betsSnapshot.empty) {
                    functions.logger.info(`No bets were placed in round ${roundId}.`);
                } else {
                    functions.logger.info(`Processing ${betsSnapshot.size} bets for round ${roundId}...`);
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

                    // Update user wallet balances in a separate loop
                    for (const [userId, totalPayout] of userPayouts.entries()) {
                        const userRef = db.collection("users").doc(userId);
                        batch.update(userRef, {
                            walletBalance: admin.firestore.FieldValue.increment(totalPayout),
                        });
                        functions.logger.info(`Awarded ${totalPayout} to user ${userId}`);
                    }
                }
            }
        }

        // --- 2. Start a New Round ---
        const newRoundId = `round-${now.toMillis()}`;
        functions.logger.info(`Starting new Spin & Win round: ${newRoundId}`);
        
        const spinTime = admin.firestore.Timestamp.fromMillis(now.toMillis() + BETTING_DURATION_SECONDS * 1000);
        const endTime = admin.firestore.Timestamp.fromMillis(now.toMillis() + ROUND_INTERVAL_MINUTES * 60 * 1000);

        const newRound = {
            id: newRoundId,
            status: "betting",
            startTime: now,
            spinTime: spinTime,
            endTime: endTime,
            winningMultiplier: null,
            resultTimestamp: null,
        };

        // Always set/overwrite the 'current' document with the new round data
        batch.set(liveStatusRef, newRound);
        
        await batch.commit();

        functions.logger.info(`Round ${newRoundId} started. Betting is open until ${spinTime.toDate()}.`);

    } catch (error) {
        functions.logger.error("Error in manageSpinAndWin function: ", error);
        // If there's an error, try to at least start a fresh round to prevent getting stuck.
         const fallbackBatch = db.batch();
         const newRoundId = `round-fallback-${now.toMillis()}`;
         const spinTime = admin.firestore.Timestamp.fromMillis(now.toMillis() + BETTING_DURATION_SECONDS * 1000);
         const endTime = admin.firestore.Timestamp.fromMillis(now.toMillis() + ROUND_INTERVAL_MINUTES * 60 * 1000);
         const newRound = {
            id: newRoundId,
            status: "betting",
            startTime: now,
            spinTime: spinTime,
            endTime: endTime,
            winningMultiplier: null,
            resultTimestamp: null,
        };
        fallbackBatch.set(liveStatusRef, newRound);
        await fallbackBatch.commit();
        functions.logger.info(`Fallback round ${newRoundId} started.`);
    }
    
    return null;
  });
