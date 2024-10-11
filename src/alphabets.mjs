export const alphabets = {
    solid : '█'.split(''),
    standard : '$@B%8&WM#*oahkbdpqwmZO0QLCJUYXzcvunxrjft/\\|()1{}[]?-_+~<>i!lI;:,"^`\''.split('').reverse(),
    variant1 : ' .,:;i1tfLCG08@'.split(''),
    variant2 : '@%#*+=-:. '.split('').reverse(),
    variant3 : '#¥¥®®ØØ$$ø0oo°++=-,.    '.split('').reverse(),
    variant4 : '#WMBRXVYIti+=;:,. '.split('').reverse(),
    'ultra-wide' : ('MMMMMMM@@@@@@@WWWWWWWWWBBBBBBBB000000008888888ZZZZZZZZZaZaaaaaa2222222SSS'
        +'SSSSXXXXXXXXXXX7777777rrrrrrr;;;;;;;;iiiiiiiii:::::::,:,,,,,,.........    ').split('').reverse(),
    wide : '@@@@@@@######MMMBBHHHAAAA&&GGhh9933XXX222255SSSiiiissssrrrrrrr;;;;;;;;:::::::,,,,,,,........        '.split(''),
    hatching : '##XXxxx+++===---;;,,...    '.split('').reverse(),
    bits : '# '.split('').reverse(),
    binary : '01 '.split('').reverse(),
    greyscale : ' ░░░░▒▒▒▒▓▓▓▓█'.split(''),
    blocks : ' ▖▚▜█'.split('')
};

export const {
    solid,
    standard,
    variant1,
    variant2,
    variant3,
    variant4,
    wide,
    hatching,
    bits,
    binary,
    greyscale,
    blocks
} = alphabets;

export const ultraWide = alphabets['ultra-wide'];