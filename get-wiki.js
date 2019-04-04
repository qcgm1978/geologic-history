// The h-index is an index that attempts to measure both the productivity and citation impact of the published body of work of a scientist or scholar.
// Google Scholar Citations provide a simple way for authors to keep track of citations to their articles.
$(() => {
  const getScientist = name => {
    let url = "http://en.wikipedia.org/w/api.php";
    url = "https://en.wikipedia.org/api/rest_v1/page/summary/Albert Einstein";
    // url = './example.csv'
    // url = './example.json'
    // fetch(url, { 'mode': 'no-cors' }).then(data => {
    //     return data.json()
    // }).then(json => {
    //     debugger
    //     })
    $.ajax({
      // request type ( GET or POST )
      type: "GET",

      // the URL to which the request is sent
      url,
      data: {
        action: "query",
        generator: "search",
        gsrnamespace: 0,
        gsrlimit: 1,
        prop: "pageimages| extracts | categories | info",
        exintro: "",
        exsentences: 1,
        srsearch: "Albert Einstein",
        srwhat: "title",
        format: "json"
      },
      dataType: "json",
      // data to be sent to the server
      // data: { action: 'query', format: 'json', lgname: 'foo', lgpassword: 'foobar' },

      // The type of data that you're expecting back from the server
      // dataType: 'json',

      // Function to be called if the request succeeds
      success: function(jsondata) {
        // debugger
      },
      error(jqXHR, textStatus, errorThrown) {
        debugger;
      }
    })
      .then(jsondata => {
        const person = Object.values(jsondata.query.pages)[0];
        const date = /\d{2}\s.+\d{4}/
          .exec(person.extract)[0]
          .replace(/&#160/g, "")
          .split(";– ");
        const name = person.title;

        return date;
      })
      .then(result => {
        var data = d3.csvParse(result);
        draw(data);
      });
  };
  const getAccomplishment = ({
    doc = {
      get() {
        return false;
      }
    },
    fields = []
  }) => {
    const infobox = doc.infobox(0),
      sentences = doc.sentences(0);
    let accomplishment = "";
    if (infobox) {
      accomplishment = fields.find(item => infobox.get(item));
      accomplishment = accomplishment && infobox.get(accomplishment).data.text;
    } else if (sentences && sentences.data.links) {
      try {
        accomplishment = sentences.data.links[0].page;
      } catch (e) {
        debugger;
      }
    }
    return accomplishment;
  };
  window.getBornDate = names => {
    return wtf
      .fetch(names, "en", {
        "Api-User-Agent": "spencermountain@gmail.com"
      })
      .then(docList => {
        let allLinks = [docList].map(doc => {
          let date = null,
            reputation = "";
          const image = doc.images(0)
            ? doc.images(0).thumb()
            : "http://127.0.0.1:8080/src/scientist.jpeg";
          const name =
            doc.options.title ||
            getAccomplishment({
              doc,
              fields: ["name", "birth_name"]
            });
          reputation = getAccomplishment({
            doc,
            fields: ["notable_ideas", "fields", "awards", "occupation"]
          });
          date = getAccomplishment({
            doc,
            fields: ["birth_date"]
          });
          return {
            name,
            date,
            reputation,
            image
          };
        });
        return allLinks;
      });
  };
  const requestData = ({
    url,
    varyField = "date",
    name = "name",
    judgeLogic,
    enableWiki = true
    // focusedData=
  }) => {
    $.ajax({
      // request type ( GET or POST )
      type: "GET",

      // the URL to which the request is sent
      url
    }).then(result => {
      let data = d3.csvParse(result);
      let len = data.length;
      len = 10;
      const requestNames = data.reduce(
        (acc, item) => acc.concat([item[name]]),
        []
      );
      const request = enableWiki
        ? getBornDate(requestNames.slice(0, len))
        : Promise.resolve([]);
      request.then(names => {
        let barData = [];
        if (names.length) {
          barData = names.map((item, i) => {
            const currentItem = data.find(it => {
              return (
                it[name] === item[name] ||
                item[name].replace(/\s\w\.\s/, " ") === it[name]
              );
            });
            const date = new Date(item.date);
            const month = date.getMonth() + 1;
            const day = date.getDate();
            const formatDate = `${date.getFullYear()}-${
              month >= 10 ? month : "0" + month
            }-${
              day >= 10 ? day : "0" + day
            } ${date.getHours()}:${date.getMinutes()}`;
            return {
              type: "",
              value: 0,
              name: item[name],
              ...currentItem,
              date: formatDate,
              leftLabel: item.reputation,
              image: item.image
            };
          });
          localStorage.barData = JSON.stringify(barData);
        } else {
          console.log("no wiki data");
          barData = data;
        }
        draw(barData, varyField, judgeLogic);
      });
    });
  };
  // requestData({
  //     url: './startups.csv', varyField: 'value', judgeLogic({ element, date }) {
  //         return +element['value'] >= +date
  //     }
  // })
  // requestData({ url: "./box-office.csv", enableWiki: false });
  // requestData({ url: "./researchers.csv" });
  // draw(JSON.parse(localStorage.barData))
  // getBornDate("Albert Einstein");
});
