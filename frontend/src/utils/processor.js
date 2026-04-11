
export const processStarlinkJson = (json) => {
  const regionsMap = new Map();

  if (Array.isArray(json)) {
    json.forEach(group => {
      group.countries?.forEach(country => {
        const region = country.regionCode.toLowerCase();
        if (!regionsMap.has(region)) {
          regionsMap.set(region, {
            region, 
            currency: country.currencyCode, 
            kitPrice: null, 
            standard: null, 
            roamReg: null, 
            roamGlobal: null, 
            roamCapped: null,
            starlinkUrl: `https://www.starlink.com/${region}`
          });
        }
        const rd = regionsMap.get(region);

        if (country.kits?.length > 0) {
          const stdKit = country.kits.find(k => k.description?.toLowerCase().includes('standard'));
          if (!rd.kitPrice) rd.kitPrice = stdKit ? stdKit.price : country.kits[0].price;
        }

        const plans = country.subscriptions || country.plans || [];
        plans.forEach(p => {
          const d = p.description?.toLowerCase() || '';
          const id = p.productId?.toLowerCase() || '';

          if (d.includes('standard') || d.includes('residential') || id.includes('residential')) {
            if (!rd.standard) rd.standard = p.price;
          } else if (d.includes('50gb') || d.includes('100gb')) {
            if (!rd.roamCapped || p.price < rd.roamCapped) rd.roamCapped = p.price;
          } else if (d.includes('global') || id.includes('global')) {
            if (!rd.roamGlobal || p.price < rd.roamGlobal) rd.roamGlobal = p.price;
          } else if (d.includes('roam') || d.includes('regional') || d.includes('mobile') || p.assetClass === 3) {
            if (!rd.roamReg || p.price < rd.roamReg) rd.roamReg = p.price;
          }
        });
      });
    });
  }
  return Array.from(regionsMap.values()).filter(r => r.standard > 0 || r.roamReg > 0);
};

export const getCountryName = (code, lang) => {
  try {
    return new Intl.DisplayNames([lang], { type: 'region' }).of(code.toUpperCase());
  } catch (e) {
    return code;
  }
};
