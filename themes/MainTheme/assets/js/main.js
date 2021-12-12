document.addEventListener("DOMContentLoaded", () => {
    feather.replace();

    const velazquezTextWrapper = document.querySelector('.bv-header-h2');
    velazquezTextWrapper.innerHTML = velazquezTextWrapper.textContent.replace(/\S/g, "<span class='letter'>$&</span>");

    anime.timeline({loop: true})
        .add({
            targets: '.bv-grid',
            right: ['-1200px', '-200px'],
            easing: 'linear',
            duration: 10000
        });

    anime.timeline({loop: false})
        .add({
            targets: '.bv-header-h2 .letter',
            scale: [4,1],
            opacity: [0,1],
            translateZ: 0,
            easing: "easeOutExpo",
            duration: 1000,
            delay: (el, i) => 70*i
        });

    anime.timeline({loop: false})
        .add({
            targets: '#bruno, #bruno-shadow',
            rotateY: [-90, 0],
            duration: 1500,
            delay: (el, i) => 45 * i
        });
});