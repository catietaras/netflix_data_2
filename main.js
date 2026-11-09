console.log("Sentiment test:", sentiment("love").score);

// Common words to leave out.
const stopWords = new Set([
  "a", "an", "the", "and", "or", "but", "of", "to", "in",
  "on", "at", "for", "from", "with", "by", "as", "is",
  "it", "its", "this", "that", "my", "your", "our",
  "his", "her", "their", "me", "you", "we", "i"
]);

stopWords.add("movie");
stopWords.add("part");

function countWords(movies) {
  // Use the first title before "//" to avoid counting
  // an alternate-language title as additional words.
  const words = movies.flatMap(movie => {
    const title = movie.title.split("//")[0];

    const tokens = title
      .toLowerCase()
      .match(/\p{L}+(?:['’]\p{L}+)*/gu) || [];

    return tokens.filter(word => !stopWords.has(word));
  });

  // Group matching words and count them.
  const counts = d3.rollup(
    words,
    group => group.length,
    word => word
  );

  // Turn the counts into a sorted array.
  return Array.from(counts, ([word, count]) => ({
    word,
    count,
    frequency: (count / movies.length) * 100,
sentiment: sentiment(word).score
  }))
  .filter(d => d.sentiment !== 0)
  .sort((a, b) =>
      b.count - a.count || a.word.localeCompare(b.word)
    )
    .slice(0, 20);
}

async function loadData() {
  const data = await d3.csv(
    "netflix_movies.csv/Movies-Table 1.csv"
  );

  const movies = data
    .filter(d => d.Title?.trim() && d.Views?.trim())
    .map(d => ({
      title: d.Title.trim(),
      views: Number(d.Views.replaceAll(",", ""))
    }))
    .filter(d => Number.isFinite(d.views));

 // Sort from most views to fewest views.
movies.sort((a, b) => b.views - a.views);

// Calculate how many movies belong in each quarter.
const groupSize = Math.floor(movies.length * 0.25);

// Select the top and bottom quarters.
const mostViewed = movies.slice(0, groupSize);
const leastViewed = movies.slice(-groupSize);

const mostViewedWords = countWords(mostViewed);
const leastViewedWords = countWords(leastViewed);
drawChart(mostViewedWords, leastViewedWords);

console.log("Most-viewed words:");
console.table(mostViewedWords);

console.log("Least-viewed words:");
console.table(leastViewedWords);

// Check the groups in the browser console.
console.log("Most viewed:", mostViewed);
console.log("Least viewed:", leastViewed);

// Show the group sizes on the page.
document.querySelector("#status").textContent =
  `Loaded ${movies.length} movies. Comparing ${mostViewed.length} most-viewed movies with ${leastViewed.length} least-viewed movies.`;
    
}

loadData().catch(error => {
  console.error(error);

  document.querySelector("#status").textContent =
    "Could not load the data. Check the console.";
});

function drawChart(mostViewedWords, leastViewedWords) {
  const width = 1100;

  const groups = [
    { name: "Most-viewed movies", words: mostViewedWords },
    { name: "Least-viewed movies", words: leastViewedWords }
  ];

  const allWords = [...mostViewedWords, ...leastViewedWords];

  // Shared scales for both groups.
  const x = d3.scaleLinear()
    .domain([-5, 5])
    .range([130, width - 130]);

  const fontSize = d3.scaleSqrt()
    .domain([0, d3.max(allWords, d => d.frequency) || 1])
    .range([12, 32]);

  d3.select("#chart").selectAll("*").remove();

  const svg = d3.select("#chart")
    .append("svg")
    .style("display", "block")
    .style("width", "100%")
    .style("max-width", `${width}px`)
    .style("font-family", "Arial, sans-serif");

  // Measure text so neighboring columns cannot overlap.
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  const columnWidth = x(1) - x(0) - 10;

  groups.forEach(group => {
    group.layout = group.words.map(d => {
      let size = fontSize(d.frequency);

      group.layout = group.words.map(d => {
  const size = 18;

  return { ...d, size };
});

      while (
        context.measureText(d.word).width > columnWidth &&
        size > 8
      ) {
        size -= 0.5;
        context.font = `600 ${size}px Arial`;
      }

      return { ...d, size };
    });

    const columns = d3.group(
      group.layout,
      d => d.sentiment
    );

    group.contentHeight = 0;

    columns.forEach(words => {
      words.sort((a, b) =>
        b.frequency - a.frequency ||
        a.word.localeCompare(b.word)
      );

      let top = 65;

      words.forEach(d => {
        d.y = top + d.size;
        top += d.size * 1.3 + 10;
      });

      group.contentHeight = Math.max(
        group.contentHeight,
        top
      );
    });
  });

  // Equal panel heights make the groups easier to compare.
  const axisY = Math.max(
    250,
    d3.max(groups, d => d.contentHeight) + 25
  );

  const panelHeight = axisY + 85;

  groups.forEach((group, index) => {
    const panel = svg.append("g")
      .attr(
        "transform",
        `translate(0, ${20 + index * panelHeight})`
      );

    panel.append("text")
      .attr("x", 30)
      .attr("y", 25)
      .attr("font-size", 21)
      .attr("font-weight", "bold")
      .text(group.name);

    // Zero divider.
    panel.append("line")
      .attr("x1", x(0))
      .attr("x2", x(0))
      .attr("y1", 50)
      .attr("y2", axisY)
      .attr("stroke", "#666")
      .attr("stroke-width", 1.5);

    // Horizontal sentiment axis.
    panel.append("g")
      .attr("transform", `translate(0, ${axisY})`)
      .call(
        d3.axisBottom(x)
          .tickValues(d3.range(-5, 6))
          .tickFormat(d => d > 0 ? `+${d}` : d)
      );

    const labels = panel.selectAll(".word")
      .data(group.layout)
      .join("text")
      .attr("class", "word")
      .attr("x", d => x(d.sentiment))
      .attr("y", d => d.y)
      .attr("text-anchor", "middle")
      .attr("font-size", d => d.size)
      .attr("font-weight", 600)
      .attr("fill", d =>
        d.sentiment < 0 ? "#98516a" : "#347a78"
      )
      .text(d => d.word);

    labels.append("title")
      .text(d =>
        `${d.word}: sentiment ${d.sentiment}; ` +
        `${d.frequency.toFixed(2)} occurrences per 100 titles`
      );

    [
      { score: -5, text: "Negative", anchor: "start" },
      { score: 0, text: "Sentiment score", anchor: "middle" },
      { score: 5, text: "Positive", anchor: "end" }
    ].forEach(d => {
      panel.append("text")
        .attr("x", x(d.score))
        .attr("y", axisY + 45)
        .attr("text-anchor", d.anchor)
        .attr("font-size", 14)
        .text(d.text);
    });
  });

  const noteY = 20 + groups.length * panelHeight;

  svg.append("text")
    .attr("x", 30)
    .attr("y", noteY)
    .attr("font-size", 13)
    .text(
      "Within each score, words run from most to least frequent. Zero scores omitted."
    );

  svg.append("text")
    .attr("x", 30)
    .attr("y", noteY + 22)
    .attr("font-size", 13)
    .text(
      "Words use equal text sizes. Hover over a word to see its frequency per 100 titles."
    );

  svg.attr("viewBox", `0 0 ${width} ${noteY + 45}`);
}
