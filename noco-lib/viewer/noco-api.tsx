export async function loadViewerPage() {
  return {
    id: "1",
    type: "div",
    props: {},
    children: [
      {
        id: "2",
        type: "h2",
        props: {},
        children: "Hello, world!",
      },
      {
        id: "3",
        type: "hero",
        props: {
          title: "Welcome to Remix!",
          subtitle: "This is a starter for a Remix app.",
          image: "https://source.unsplash.com/random/800x600",
        },
        children: [],
      },
    ],
  };
}
