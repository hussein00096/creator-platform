// Runs before paint: sets language/direction and flags browsers without CSS scroll timelines.
// The old "motion off" switch (bq-still) no longer exists in the design, so a stored value is cleared
// instead of silently disabling all motion for that visitor.
export const themeBoot = `(function(){var root=document.documentElement;var path=location.pathname;var en=path==='/en'||path.indexOf('/en/')===0;root.lang=en?'en':'ar';root.dir=en?'ltr':'rtl';try{localStorage.removeItem('bq-still');}catch(e){}if(!(window.CSS&&CSS.supports&&CSS.supports('animation-timeline: view()')))root.classList.add('nsd');})();`;
