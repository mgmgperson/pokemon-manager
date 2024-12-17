#include "Trainer.h"
#include "SinglesMatch.h"
#include "PythonRunner.h"
#include "Rating.h"
#include "MentalRating.h"
#include "FormatRating.h"
#include <crow.h> // Crow is a lightweight C++ micro web framework
#include <iostream>
#include <json/json.h>

int main() {
    crow::SimpleApp app;

    // Route to simulate battle (already present)
    CROW_ROUTE(app, "/simulate-battle/<int>/<int>")
    ([](crow::request& req, crow::response& res, int trainer1_id, int trainer2_id) {
        Trainer trainer1 = Trainer::fetchTrainerFromDB(trainer1_id);
        Trainer trainer2 = Trainer::fetchTrainerFromDB(trainer2_id);

        SinglesMatch match(trainer1, trainer2);
        match.simulate();
        Trainer& winner = match.getWinner();

        crow::json::wvalue result;
        result["winner"] = winner.getName();
        result["trainer1_name"] = trainer1.getName();
        result["trainer1_rating"] = trainer1.getRating();
        result["trainer2_name"] = trainer2.getName();
        result["trainer2_rating"] = trainer2.getRating();

        // CORS
        res.set_header("Access-Control-Allow-Origin", "*");
        res.set_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
        res.set_header("Access-Control-Allow-Headers", "Content-Type");

        res.write(result.dump());
        res.end();
    });

    // CORS preflight for the above route
    CROW_ROUTE(app, "/simulate-battle/<int>/<int>").methods(crow::HTTPMethod::Options)
    ([](crow::request&, crow::response& res, int, int) {
        res.set_header("Access-Control-Allow-Origin", "*");
        res.set_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
        res.set_header("Access-Control-Allow-Headers", "Content-Type");
        res.end();
    });

    // --------------------------------------------------------------
    // NEW: Generate mental ratings for a trainer (in-memory, not saved)
    // --------------------------------------------------------------
    CROW_ROUTE(app, "/generate-mental-ratings/<int>")
    ([](const crow::request& req, crow::response& res, int trainer_id) {
        std::cout << "Generating mental ratings for trainer ID " << trainer_id << "\n";

        // 1) Fetch trainer + rating from DB
        Trainer t = Trainer::fetchTrainerFromDB(trainer_id);
        if (t.getId() == 0) {
            crow::json::wvalue error;
            error["error"] = "No trainer found with ID " + std::to_string(trainer_id);
            // Set CORS and Content-Type headers even on errors
            res.set_header("Access-Control-Allow-Origin", "*");
            res.set_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
            res.set_header("Access-Control-Allow-Headers", "Content-Type");
            res.set_header("Content-Type", "application/json");
            res.write(error.dump());
            res.end();
            return;
        }

        Rating r = Rating::fetchLatestByTrainerId(trainer_id);
        MentalRating trainermr = MentalRating::fetchByRatingId(r.id);
        if (r.id == 0) {
            crow::json::wvalue error;
            error["error"] = "No rating record found for trainer " + std::to_string(trainer_id);
            res.set_header("Access-Control-Allow-Origin", "*");
            res.set_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
            res.set_header("Access-Control-Allow-Headers", "Content-Type");
            res.set_header("Content-Type", "application/json");
            res.write(error.dump());
            res.end();
            return;
        }
        
        if (trainermr.id == 0) {
            crow::json::wvalue error;
            error["error"] = "No mental rating record found for rating " + std::to_string(r.id);
            res.set_header("Access-Control-Allow-Origin", "*");
            res.set_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
            res.set_header("Access-Control-Allow-Headers", "Content-Type");
            res.set_header("Content-Type", "application/json");
            res.write(error.dump());
            res.end();
            return;
        }

        // 2) Generate random mental ratings
        Json::Value randomVals;
        try {
            randomVals = PythonRunner::runPythonGenerator(r.overall_rating, "mental");
        } catch (const std::exception& e) {
            crow::json::wvalue error;
            error["error"] = "Failed to generate mental ratings: ";
            error["details"] = e.what();
            res.set_header("Access-Control-Allow-Origin", "*");
            res.set_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
            res.set_header("Access-Control-Allow-Headers", "Content-Type");
            res.set_header("Content-Type", "application/json");
            res.write(error.dump());
            res.end();
            return;
        }

        std::cout << "Generated random values: " << randomVals << "\n";

        // 3) Create an *unsaved* MentalRating object
        MentalRating mr;
        mr.id = 0;                // 0 means “unsaved” in our code
        mr.rating_id = r.id;      // link to the rating row
        mr.planning_rating          = randomVals.get("planning_rating", 0).asInt();
        mr.risk_rating              = randomVals.get("risk_rating", 0).asInt();
        mr.prediction_rating        = randomVals.get("prediction_rating", 0).asInt();
        mr.clutch_rating            = randomVals.get("clutch_rating", 0).asInt();
        mr.consistency_rating       = randomVals.get("consistency_rating", 0).asInt();
        mr.motivation_rating        = randomVals.get("motivation_rating", 0).asInt();
        mr.pokemon_knowledge_rating = randomVals.get("pokemon_knowledge_rating", 0).asInt();
        mr.trainer_knowledge_rating = randomVals.get("trainer_knowledge_rating", 0).asInt();
        mr.training_rating          = randomVals.get("training_rating", 0).asInt();
        mr.conditioning_rating      = randomVals.get("conditioning_rating", 0).asInt();
        mr.determination_rating     = randomVals.get("determination_rating", 0).asInt();
        mr.facilities_rating        = randomVals.get("facilities_rating", 0).asInt();
        mr.attack_rating            = randomVals.get("attack_rating", 0).asInt();
        mr.defense_rating           = randomVals.get("defense_rating", 0).asInt();
        mr.speed_rating             = randomVals.get("speed_rating", 0).asInt();
        mr.gimmick_rating           = randomVals.get("gimmick_rating", 0).asInt();

        crow::json::wvalue result;
        for (auto &kv : mr.toMap()) {
            result[kv.first] = kv.second;
        }

        // 5) Set CORS headers and return
        res.set_header("Access-Control-Allow-Origin", "*");
        res.set_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
        res.set_header("Access-Control-Allow-Headers", "Content-Type");
        res.set_header("Content-Type", "application/json");
        res.write(result.dump());
        res.end();
    });

    // Preflight for /generate-mental-ratings/<int>
    CROW_ROUTE(app, "/generate-mental-ratings/<int>").methods(crow::HTTPMethod::Options)
    ([](const crow::request&, crow::response& res, int trainer_id) {
        res.set_header("Access-Control-Allow-Origin", "*");
        res.set_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
        res.set_header("Access-Control-Allow-Headers", "Content-Type");
        res.end();
    });

    CROW_ROUTE(app, "/generate-format-ratings/<int>")
    ([](const crow::request& req, crow::response& res, int trainer_id){
        // Set up for randomizing FormatRating
        Trainer t = Trainer::fetchTrainerFromDB(trainer_id);
        if (t.getId() == 0) {
            crow::json::wvalue error;
            error["error"] = "No trainer found with ID " + std::to_string(trainer_id);
            res.set_header("Access-Control-Allow-Origin", "*");
            res.set_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
            res.set_header("Access-Control-Allow-Headers", "Content-Type");
            res.write(error.dump());
            res.end();
            return;
        }

        // Fetch the rating row for the trainer
        Rating r = Rating::fetchLatestByTrainerId(trainer_id);
        if (r.id == 0) {
            crow::json::wvalue error;
            error["error"] = "No rating record found for trainer " + std::to_string(trainer_id);
            res.set_header("Access-Control-Allow-Origin", "*");
            res.set_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
            res.set_header("Access-Control-Allow-Headers", "Content-Type");
            res.write(error.dump());
            res.end();
            return;
        }

        // Check if FormatRating row exists for that ratingId
        FormatRating trainerFR = FormatRating::fetchByRatingId(r.id);
        if (trainerFR.id == 0) {
            // It's possible the row doesn't exist yet; let's not throw an error,
            // we can just use a default object with id=0
            // Alternatively, we can create a new row. For now let's proceed without error.
            std::cout << "No existing format_rating found for rating_id=" << r.id << ". Using a blank record.\n";
        }

        // 2) Generate random mental ratings
        Json::Value randomVals;
        try {
            randomVals = PythonRunner::runPythonGenerator(r.overall_rating, "format");
        } catch (const std::exception& e) {
            crow::json::wvalue error;
            error["error"] = "Failed to generate mental ratings: ";
            error["details"] = e.what();
            res.set_header("Access-Control-Allow-Origin", "*");
            res.set_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
            res.set_header("Access-Control-Allow-Headers", "Content-Type");
            res.set_header("Content-Type", "application/json");
            res.write(error.dump());
            res.end();
            return;
        }

        // Build an unsaved FormatRating object
        FormatRating fr;
        fr.id = trainerFR.id;    // if trainerFR.id=0, means new row on Save
        fr.rating_id = r.id;
        fr.singles_rating = randomVals.get("singles_rating", 0).asInt();
        fr.doubles_rating = randomVals.get("doubles_rating", 0).asInt();
        fr.tag_battle_rating = randomVals.get("tag_battle_rating", 0).asInt();
        fr.battle_factory_rating = randomVals.get("battle_factory_rating", 0).asInt();
        fr.rotation_rating = randomVals.get("rotation_rating", 0).asInt();
        fr.sixes_rating = randomVals.get("sixes_rating", 0).asInt();
        fr.threes_rating = randomVals.get("threes_rating", 0).asInt();
        fr.twos_rating = randomVals.get("twos_rating", 0).asInt();

        // Return JSON response (unsaved)
        crow::json::wvalue result;
        for (auto &kv : fr.toMap()) {
            result[kv.first] = kv.second;
        }

        res.set_header("Access-Control-Allow-Origin", "*");
        res.set_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
        res.set_header("Access-Control-Allow-Headers", "Content-Type");
        res.write(result.dump());
        res.end();
    });


    CROW_ROUTE(app, "/generate-format-ratings/<int>").methods(crow::HTTPMethod::Options)
    ([](const crow::request& req, crow::response& res, int trainer_id){
        res.set_header("Access-Control-Allow-Origin", "*");
        res.set_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
        res.set_header("Access-Control-Allow-Headers", "Content-Type");
        res.end();
    });
    // --------------------------------------------------------------

    app.port(18080).multithreaded().run();
}
