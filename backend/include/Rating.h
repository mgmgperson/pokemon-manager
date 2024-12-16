#ifndef RATING_H
#define RATING_H

#include <string>

class Rating {
public:
    int id;
    int trainer_id;
    int year;
    int overall_rating;
    int typing_rating;
    int mixed_rating;
    int special_rating;

    Rating();  // default constructor

    // Fetch the newest rating row (highest year) for a given trainer
    static Rating fetchLatestByTrainerId(int trainerId);
};

#endif
