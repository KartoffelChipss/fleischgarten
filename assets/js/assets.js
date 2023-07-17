const randomColor = "#"+((1<<24)*Math.random()|0).toString(16);
document.documentElement.style.setProperty('--random-color-1', "#"+((1<<24)*Math.random()|0).toString(16));
document.documentElement.style.setProperty('--random-color-2', "#"+((1<<24)*Math.random()|0).toString(16));
document.documentElement.style.setProperty('--random-color-3', "#"+((1<<24)*Math.random()|0).toString(16));

function playAudio(src, volume) {
    let audio = new Audio(src);

    if (volume && Number(volume) && Number(volume) > 0.0 && Number(volume) <= 1.0) {
        audio.volume = Number(volume);
    }

    audio.play();
}