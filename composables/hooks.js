export const useIsProducton = () => process.env.NODE_ENV === "production";

export const useableLocales = ref([]);

export const getLocales = async (type = "Card", titleNum) => {
  const { data } = await useAsyncData(`posts/${type}/${titleNum}`, () =>
    useStrapi4().find(`posts`, {
      fields: ["locales"],
      filters: {
        title: {
          $eq: `${type} Part ${titleNum}`,
        },
      },
      publicationState: useIsProducton() ? "live" : "preview",
    })
  );

  let locales = [];

  if (data.value.data && data.value.data.length > 0) {
    locales = data.value.data[0].attributes.locales;
  }

  useableLocales.value = locales;

  return locales;
};
