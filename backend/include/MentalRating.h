#ifndef MENTAL_RATING_H
#define MENTAL_RATING_H

#include <sqlite3.h>
#include <string>
#include <map>

class MentalRating {
public:
    int id;
    int rating_id;
    int planning_rating;
    int risk_rating;
    int prediction_rating;
    int clutch_rating;
    int consistency_rating;
    int motivation_rating;
    int pokemon_knowledge_rating;
    int trainer_knowledge_rating;
    int training_rating;
    int conditioning_rating;
    int determination_rating;
    int facilities_rating;
    int attack_rating;
    int defense_rating;
    int speed_rating;
    int gimmick_rating;

    // Constructors
    MentalRating();
    MentalRating(int ratingId); // possibly for creation

    // DB methods
    static MentalRating fetchByRatingId(int ratingId);
    void saveToDB();  // inserts/updates the DB

    // For convenience, convert to crow::json or a std::map
    std::map<std::string, int> toMap() const;
};

#endif
