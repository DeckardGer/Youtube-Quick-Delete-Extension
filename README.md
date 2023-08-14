# Youtube: Quick Delete
Have you ever gotten annoyed that Youtube removed the ability to instantly remove videos from your playlists?

Good news! I added that functionality back.

This is a simple side project that adds a bin button next to every video in every Youtube playlist.

HOW IT WORKS
---
When you load a Youtube page, it loads the content.js and styles.css files.
There are 2 different places the delete button has to be added:
1. URLs with youtube.com/playlist.
2. URLs with youtube.com/watch where they selected a video from a playlist.

To add the new button elements, we need the element which contains the list of videos in the given playlist.
The element for the youtube.com/watch method exist on every page and get populated when necessary,
so we can grab those elements immediately and call the `injectObserver()` method.
The element for the youtube.com/playlist method however doesn't exist
until you visit a page with that URL. We set up an event listener that listens for the `yt-page-data-updated`,
which is a custom event with fires whenever you redirect in youtube. When on a youtube.com/playlist page,
it calls the `injectObserver()` method and removes the event listener.

The `injectObserver()` method adds a mutation observer that listens for the elements mentioned above.
This means whenever the contents inside the videos list change, it calls the `addDeleteButton()` method.
This method adds a button to the provided video and adds an event listener to it.

When the button is clicked, it opens the popup menu using the menu button associated with each video.
It then finds the delete button and clicks it. Simple as that.

---

There are obviously things I skipped over like how I get the popup menu element or the styling for the buttons,
but that is basically how it works.

