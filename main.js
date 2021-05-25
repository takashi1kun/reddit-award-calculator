Number.prototype.toFixedDown = function (digits) {
  var re = new RegExp("(\\d+\\.\\d{" + digits + "})(\\d)"),
    m = this.toString().match(re);
  return m ? parseFloat(m[1]) : this.valueOf();
};

function getQueryStringParams(query) {
  return new URLSearchParams(window.location.search).get(query) || false;
}

function clickButton() {
  const url = document.getElementById("urlField").value;
  RESULT = new CalculateRedditAwards(url);
  resultField().value = "Loading";
  resultField().style.height = "auto";
  repeaterId = setInterval(loader, 250);
  return false;
}
let repeaterId = 0;
function loader() {
  if (repeaterId !== 0) {
    if (RESULT !== undefined && RESULT.loaded) {
      clearInterval(repeaterId);
      repeaterId = 0;
      readValue();
    } else {
      switch (resultField().value) {
        case "Loading":
          resultField().value = "Loading.";
          break;
        case "Loading.":
          resultField().value = "Loading..";
          break;
        case "Loading..":
          resultField().value = "Loading...";
          break;
        case "Loading...":
          resultField().value = "Loading";
          break;
      }
    }
  }
}
const resultField = () => document.getElementById("result");
function readValue() {
  resultField().style.height = "250px";
  resultField().value = `Total Days of Premium: ${RESULT.daysOfPremium.toLocaleString()} days
Total Years of Premium: ${RESULT.yearsOfPremiumInt.toLocaleString()} years
Total Months of Premium: ${RESULT.monthsOfPremium.toLocaleString()} months
Total time of Premium: ${RESULT.totalPremium}
Total cost of this Premium time: ${RESULT.costPremium
    .toFixedDown(2)
    .toLocaleString()}$ (aprox)
Total Awards: ${RESULT.count.toLocaleString()} Awards Given
Total Coins Spent in Awards: ${RESULT.cost.toLocaleString()} Coins
Total coins Awarded: ${RESULT.reward.toLocaleString()} Coins`;
  const currentUrlQuery = getQueryStringParams("post");
  const urlField = document.getElementById("urlField").value;
  if (!currentUrlQuery || urlField != currentUrlQuery) {
    window.history.pushState(
      {
        id: "query"
      },
      "Reddit Award Calculator",
      `${window.location.pathname}?post=${urlField}`
    );
  }
  const shareLink = `${window.location.protocol}//${window.location.host}${window.location.pathname}?post=${urlField}`;
  const shareLinkEl = document.getElementById("shareLink");
  shareLinkEl.innerHTML = `Share with friends:<br> <a style="word-break: break-all;" href="${shareLink}">${shareLink}</a>`;
}

let RESULT = undefined;
function lastCharacter(str) {
  return str.charAt(str.length - 1);
}
function removeUrlFragments(url) {
  return url.split("?")[0].split("#")[0];
}
function parseUrl(url) {
  let newUrl = url;
  if (lastCharacter(url) == "/") {
    newUrl = newUrl.slice(0, -1);
  }
  return removeUrlFragments(newUrl);
}
class CalculateRedditAwards {
  constructor(url) {
    this.awardList = [];
    this.loaded = false;
    fetch(`${parseUrl(url)}.json`)
      .then((x) => x.json())
      .then((x) => this.dealWithData(x));
  }
  dealWithData(data) {
    const realData = data[0].data.children[0].data.all_awardings;
    this.awardList = realData.map((x) => new Award(x));
    this.loaded = true;
  }
  getAttr(fn) {
    return this.awardList.length > 0
      ? this.awardList.map(fn).reduce((a, b) => a + b, 0)
      : 0;
  }
  get daysOfPremium() {
    return this.getAttr((x) => x.totalPremium);
  }
  get yearsOfPremium() {
    return this.daysOfPremium / 365;
  }
  get yearsOfPremiumInt() {
    return Math.trunc(this.yearsOfPremium);
  }
  get monthsOfPremium() {
    return Math.trunc(this.yearsOfPremium * 12);
  }
  get totaldaysinFullYears() {
    return this.yearsOfPremiumInt * 365;
  }
  get daysWithoutYears() {
    return this.daysOfPremium - this.totaldaysinFullYears;
  }
  get remainingMonths() {
    return Math.trunc((this.daysWithoutYears / 365) * 12);
  }
  get remainingDays() {
    return Math.trunc(
      this.daysWithoutYears - (this.remainingMonths / 12) * 365
    );
  }
  get totalPremium() {
    return `${this.yearsOfPremiumInt.toLocaleString()} Years, ${this.remainingMonths.toLocaleString()} Months, ${this.remainingDays.toLocaleString()} Days`;
  }
  get costPremium() {
    return this.yearsOfPremiumInt * 59.99 + this.remainingMonths * 5.99;
  }
  get cost() {
    return this.getAttr((x) => x.totalCost);
  }
  get count() {
    return this.getAttr((x) => x.count);
  }
  get reward() {
    return this.getAttr((x) => x.totalReward);
  }
}
class Award {
  constructor(data) {
    this.daysOfPremium = 0;
    this.name = "";
    this.icon = "";
    this.description = "";
    this.count = 0;
    this.cost = 0;
    this.reward = 0;
    this.daysOfPremium = data.days_of_premium || 0;
    this.cost = data.coin_price || 0;
    this.count = data.count || 0;
    this.reward = data.coin_reward || 0;
  }
  get givesPremium() {
    return this.daysOfPremium > 0;
  }
  get givesReward() {
    return this.reward > 0;
  }
  get totalPremium() {
    return this.givesPremium ? this.daysOfPremium * this.count : 0;
  }
  get totalCost() {
    return this.cost * this.count;
  }
  get totalReward() {
    return this.givesReward ? this.reward * this.count : 0;
  }
}
(() => {
  const url = getQueryStringParams("post");
  if (url) {
    document.getElementById("urlField").value = url;
    clickButton();
  }
})();
