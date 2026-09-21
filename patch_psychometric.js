const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'frontend/src/pages/PsychometricTests.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add searchTerm and useMemo imports
content = content.replace(
  'import React, { useState, useEffect, useRef } from "react";',
  'import React, { useState, useEffect, useRef, useMemo } from "react";'
);

// 2. Add SearchIcon import
content = content.replace(
  'import QuizIcon from "@mui/icons-material/Quiz";',
  'import QuizIcon from "@mui/icons-material/Quiz";\nimport SearchIcon from "@mui/icons-material/Search";'
);

// 3. Add searchTerm state
content = content.replace(
  'const [selectedCategory, setSelectedCategory] = useState("All Assessments");',
  'const [selectedCategory, setSelectedCategory] = useState("All Assessments");\n  const [searchTerm, setSearchTerm] = useState("");'
);

// 4. Replace filteredTests with useMemo
const filterLogicOld = `  const filteredTests = tests.filter((t) => {
    if (selectedCategory === "All Assessments") return true;
    const cat = UI_CONFIG[t.slug]?.category;
    return cat === selectedCategory;
  });`;

const filterLogicNew = `  const processedTests = useMemo(() => {
    let result = [...tests];

    // Filter by Category
    if (selectedCategory !== "All Assessments") {
      result = result.filter(t => UI_CONFIG[t.slug]?.category === selectedCategory);
    }

    // Filter by Search Term
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      result = result.filter(t => 
        (t.name && t.name.toLowerCase().includes(q)) ||
        (t.description && t.description.toLowerCase().includes(q))
      );
    }

    return result;
  }, [tests, selectedCategory, searchTerm]);`;

content = content.replace(filterLogicOld, filterLogicNew);

// 5. Add Search Bar below categories
const categoriesHTML = `          {/* Interactive Category Filter Pills */}
          <div className="mt-8 flex flex-wrap justify-center gap-2.5">
            {CATEGORIES.map((cat) => {
              const isActive = selectedCategory === cat;
              const count = cat === "All Assessments"
                ? tests.length
                : tests.filter((t) => UI_CONFIG[t.slug]?.category === cat).length;

              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={\`relative rounded-full px-6 py-2.5 text-xs sm:text-sm font-bold tracking-wide transition-all duration-300 \${
                    isActive
                      ? 'bg-[#0a5c2c] text-white shadow-lg scale-105'
                      : 'bg-[#061e12]/5 text-[#061e12]/70 border border-[#061e12]/10 hover:bg-[#061e12]/10'
                  }\`}
                >
                  <span className="relative z-10 flex items-center gap-2">
                    {cat}
                    <span
                      className={\`rounded-full px-2 py-0.5 text-[0.7rem] \${
                        isActive ? 'bg-white/20 text-white' : 'bg-[#061e12]/10 text-[#061e12]/60'
                      }\`}
                    >
                      {count}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>`;

const searchBarHTML = `          {/* Search Bar */}
          <div className="mx-auto mt-8 max-w-xl">
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <SearchIcon className="text-[#061e12]/40 transition-colors group-focus-within:text-[#0a5c2c]" />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search assessments by name or description..."
                className="w-full bg-[#061e12]/5 border border-[#061e12]/10 text-[#061e12] rounded-full pl-11 pr-4 py-3.5 text-sm outline-none transition-all focus:bg-white focus:border-[#0a5c2c]/40 focus:ring-4 focus:ring-[#0a5c2c]/10 placeholder:text-[#061e12]/40"
              />
            </div>
          </div>`;

content = content.replace(categoriesHTML, categoriesHTML + '\n\n' + searchBarHTML);

// 6. Update mapping and add empty state
content = content.replace('filteredTests.map', 'processedTests.map');
content = content.replace(
  '              {processedTests.map((test, index) => (',
  `              {processedTests.length === 0 ? (
                <div className="col-span-1 md:col-span-12 text-center py-20 bg-white/5 rounded-3xl border border-[#061e12]/10">
                  <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full bg-[#061e12]/5 text-[#061e12]/40">
                    <SearchIcon fontSize="large" />
                  </div>
                  <h3 className="font-['DM_Serif_Display',Georgia,serif] text-2xl text-[#061e12] mb-3">
                    No matching assessments
                  </h3>
                  <p className="text-[#061e12]/60 mb-6">Try adjusting your filters or search term.</p>
                  <button
                    onClick={() => {
                      setSearchTerm("");
                      setSelectedCategory("All Assessments");
                    }}
                    className="px-6 py-2.5 rounded-full font-bold text-white bg-[#0a5c2c] transition-transform hover:scale-105 active:scale-95"
                  >
                    Clear Filters
                  </button>
                </div>
              ) : processedTests.map((test, index) => (`
);
content = content.replace(
  '                />\n              ))}',
  '                />\n              ))}'
);


fs.writeFileSync(filePath, content, 'utf8');
console.log('Patched PsychometricTests.jsx');
