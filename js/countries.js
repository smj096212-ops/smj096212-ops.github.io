// 국가 선택 드롭다운 + 국기 이모지/이름 헬퍼. ISO 3166-1 alpha-2 코드 목록만 갖고 있고,
// 국기 이모지는 유니코드 Regional Indicator Symbol 연산으로 즉석에서 만든다(하드코딩 불필요).

const COUNTRY_CODES = [
  "AD","AE","AF","AG","AL","AM","AO","AR","AT","AU","AZ","BA","BB","BD","BE","BF","BG","BH","BI","BJ",
  "BN","BO","BR","BS","BT","BW","BY","BZ","CA","CD","CF","CG","CH","CI","CL","CM","CN","CO","CR","CU",
  "CV","CY","CZ","DE","DJ","DK","DM","DO","DZ","EC","EE","EG","ER","ES","ET","FI","FJ","FM","FR","GA",
  "GB","GD","GE","GH","GM","GN","GQ","GR","GT","GW","GY","HN","HR","HT","HU","ID","IE","IL","IN","IQ",
  "IR","IS","IT","JM","JO","JP","KE","KG","KH","KI","KM","KN","KP","KR","KW","KZ","LA","LB","LC","LI",
  "LK","LR","LS","LT","LU","LV","LY","MA","MC","MD","ME","MG","MH","MK","ML","MM","MN","MR","MT","MU",
  "MV","MW","MX","MY","MZ","NA","NE","NG","NI","NL","NO","NP","NR","NZ","OM","PA","PE","PG","PH","PK",
  "PL","PT","PW","PY","QA","RO","RS","RU","RW","SA","SB","SC","SD","SE","SG","SI","SK","SL","SM","SN",
  "SO","SR","SS","ST","SV","SY","SZ","TD","TG","TH","TJ","TL","TM","TN","TO","TR","TT","TV","TW","TZ",
  "UA","UG","US","UY","UZ","VA","VC","VE","VN","VU","WS","YE","ZA","ZM","ZW",
];

function countryFlagEmoji(code) {
  return code
    .toUpperCase()
    .replace(/./g, (ch) => String.fromCodePoint(127397 + ch.charCodeAt(0)));
}

const regionNames = new Intl.DisplayNames(["en"], { type: "region" });

function countryName(code) {
  return regionNames.of(code) || code;
}

// 국가 select를 이름 가나다(알파벳)순으로 채운다. 맨 위에 "선택 안 함" 빈 옵션을 둔다.
function populateCountrySelect(selectEl) {
  const options = COUNTRY_CODES.map((code) => ({ code, name: countryName(code) })).sort((a, b) =>
    a.name.localeCompare(b.name)
  );

  const blank = document.createElement("option");
  blank.value = "";
  blank.textContent = "Select country (optional)";
  selectEl.appendChild(blank);

  options.forEach(({ code, name }) => {
    const opt = document.createElement("option");
    opt.value = code;
    opt.textContent = `${countryFlagEmoji(code)} ${name}`;
    selectEl.appendChild(opt);
  });
}
