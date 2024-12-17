#ifndef FORMAT_RATING_H
#define FORMAT_RATING_H

#include <sqlite3.h>
#include <string>
#include <map>

class FormatRating {
public:
    int id;
    int rating_id;

    int singles_rating;
    int doubles_rating;
    int tag_battle_rating;
    int battle_factory_rating;
    int rotation_rating;
    int sixes_rating;
    int threes_rating;
    int twos_rating;

    // Constructors
    FormatRating();
    FormatRating(int ratingId); // possibly for creation

    // DB methods
    static FormatRating fetchByRatingId(int ratingId);
    void saveToDB();  // inserts/updates the DB

    // Convert to a map for easy JSON output
    std::map<std::string, int> toMap() const;
};

#endif
