#include "Trainer.h"
#include "SinglesMatch.h"
#include "PythonRunner.h"
#include "Rating.h"
#include "MentalRating.h"
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
            randomVals = PythonRunner::runPythonGenerator(r.overall_rating);
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

        // 4) Convert to JSON in specific order
        crow::json::wvalue result;
        result["id"] = mr.id;
        result["rating_id"] = mr.rating_id;
        result["planning_rating"] = mr.planning_rating;
        result["risk_rating"] = mr.risk_rating;
        result["prediction_rating"] = mr.prediction_rating;
        result["clutch_rating"] = mr.clutch_rating;
        result["consistency_rating"] = mr.consistency_rating;
        result["motivation_rating"] = mr.motivation_rating;
        result["pokemon_knowledge_rating"] = mr.pokemon_knowledge_rating;
        result["trainer_knowledge_rating"] = mr.trainer_knowledge_rating;
        result["training_rating"] = mr.training_rating;
        result["conditioning_rating"] = mr.conditioning_rating;
        result["determination_rating"] = mr.determination_rating;
        result["facilities_rating"] = mr.facilities_rating;
        result["attack_rating"] = mr.attack_rating;
        result["defense_rating"] = mr.defense_rating;
        result["speed_rating"] = mr.speed_rating;
        result["gimmick_rating"] = mr.gimmick_rating;

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
    // --------------------------------------------------------------

    app.port(18080).multithreaded().run();
}
