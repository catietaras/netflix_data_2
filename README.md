# We All Love a Tragic Love Story?

## Question
Do the most-viewed and least-viewed movies use different emotional words in their titles?

## Data
I used the Movies sheet from Netflix’s January–June 2025 engagement report.

## Comparison
I compared the top 25% and bottom 25% of movies by views.

Each panel shows the 20 most common title words with positive
or negative sentiment scores. Words scoring zero are excluded.

The x-axis shows sentiment. A line at zero divides negative
and positive scores. Both panels use the same scale.

Words have equal text sizes. Within each score, they run from
most to least frequent. Hovering shows frequency per 100 titles.

## Steps
1. Load the data.
2. Remove rows without a title or valid views.
3. Sort movies by views.
4. Select the top and bottom 25%.
5. Keep the first title when alternate titles are separated by //.
6. Make the titles lowercase and split them into words.
7. Remove punctuation and stop words, including “movie” and “part.”
8. Count words in each group with d3.rollup().
9. Calculate frequency per 100 titles.
10. Score the words with wink-sentiment.
11. Exclude words scoring zero.
12. Keep the 20 most common remaining words in each group.
13. Use D3 to position words by sentiment.
14. Order words within each score by frequency.
15. Add a title and finding.

## Limits
I scored individual words, not the movies themselves.
The scores do not account for the meaning of a complete title.
A zero score can mean a word is neutral or unrecognized.

The report covers six months. Movies released later had less
time to get views. Movies tied at a group boundary are separated
by their order in the data.

## Finding
Of the 20 words shown in each group, more are negative in
the most-viewed group and more are positive in the least-viewed group.

This describes the selected words. It does not show that
negative titles cause more views.