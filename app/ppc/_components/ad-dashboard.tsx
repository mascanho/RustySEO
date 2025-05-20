// @ts-nocheck
"use client";

import { useState, useEffect } from "react";
import { AdForm } from "./ad-form";
import { AdList } from "./ad-list";
import { AdPreview } from "./ad-preview";
import { DashboardHeader } from "./dashboard-header";
import { DashboardLayout } from "./dashboard-layout";
import { toast } from "sonner";

export function AdDashboard() {
  const [ads, setAds] = useState<Ad[]>([
    {
      id: "1",
      name: "Sample Search Ad",
      type: "search",
      headlines: [
        "Professional Web Design",
        "Custom Website Solutions",
        "Responsive Web Development",
        "24/7 Customer Support",
        "Award-Winning Design Team",
      ],
      descriptions: [
        "Create stunning websites that convert visitors into customers. Get started today!",
        "Professional web design services tailored to your business needs.",
        "Affordable web design packages for small businesses and startups.",
      ],
      keywords: ["web design", "website", "professional"],
      finalUrl: "https://example.com",
      displayPath: "example.com/web-design",
      sitelinks: [
        {
          id: "sl1",
          title: "Portfolio",
          description1: "View our award-winning designs",
          description2: "See examples of our best work",
          url: "https://example.com/portfolio",
        },
        {
          id: "sl2",
          title: "Services",
          description1: "Explore our web design services",
          url: "https://example.com/services",
        },
        {
          id: "sl3",
          title: "Pricing",
          url: "https://example.com/pricing",
        },
        {
          id: "sl4",
          title: "Contact Us",
          description1: "Get in touch with our team",
          url: "https://example.com/contact",
        },
      ],
    },
    {
      id: "2",
      name: "Performance Max Campaign",
      type: "pmax",
      headlines: [
        "Boost Your Online Sales",
        "Maximize Conversion Rate",
        "Smart Bidding Strategy",
        "Cross-Channel Advertising",
        "AI-Powered Campaigns",
      ],
      descriptions: [
        "Leverage Google's machine learning to maximize conversions across all channels.",
        "One campaign to reach customers wherever they are online.",
      ],
      keywords: ["performance max", "conversions", "sales"],
      finalUrl: "https://example.com/pmax",
      displayPath: "example.com/performance",
    },
    {
      id: "3",
      name: "Display Network Ad",
      type: "display",
      headlines: [
        "Visual Brand Awareness",
        "Reach New Audiences",
        "Engaging Display Ads",
        "Retargeting Campaign",
      ],
      descriptions: [
        "Reach potential customers with visually engaging display ads across the web.",
        "Build brand awareness with targeted display advertising.",
      ],
      keywords: ["display", "awareness", "retargeting"],
      finalUrl: "https://example.com/display",
      displayPath: "example.com/display-ads",
    },
  ]);

  const [selectedAd, setSelectedAd] = useState<Ad | null>(ads[0]);
  const [sidebarView, setSidebarView] = useState<string>("dashboard");

  useEffect(() => {
    const handleClearSelectedAd = () => {
      setSelectedAd(null);
    };

    window.addEventListener("clearSelectedAd", handleClearSelectedAd);

    return () => {
      window.removeEventListener("clearSelectedAd", handleClearSelectedAd);
    };
  }, []);

  const handleAddAd = () => {
    const newAd: Ad = {
      id: Date.now().toString(),
      name: "New Ad",
      type: "search", // Default type
      headlines: [""],
      descriptions: [""],
      keywords: [],
      finalUrl: "",
      displayPath: "",
      sitelinks: [],
    };
    setAds([...ads, newAd]);
    setSelectedAd(newAd);
    setSidebarView("ads");

    toast.info({
      title: "Ad added",
      description: "New ad has been added successfully",
    });
  };

  const handleCloneAd = (ad: Ad) => {
    // Clone sitelinks with new IDs
    const clonedSitelinks = ad.sitelinks
      ? ad.sitelinks.map((sitelink) => ({
          ...sitelink,
          id: Date.now() + Math.random().toString(36).substring(2, 9),
        }))
      : [];

    const clonedAd: Ad = {
      ...ad,
      id: Date.now().toString(),
      name: `${ad.name} (Copy)`,
      sitelinks: clonedSitelinks,
    };
    setAds([...ads, clonedAd]);
    setSelectedAd(clonedAd);
    setSidebarView("ads");

    toast.info({
      title: "Ad cloned",
      description: `"${ad.name}" has been cloned successfully`,
    });
  };

  const handleSelectAd = (ad: Ad) => {
    setSelectedAd(ad);
    setSidebarView("ads");
  };

  const handleDeleteAd = (adId: string) => {
    try {
      console.log("Delete function called with ID:", adId);

      // Find the ad to be deleted
      const adToDelete = ads.find((ad) => ad.id === adId);

      if (!adToDelete) {
        console.error("Ad not found:", adId);
        return;
      }

      // Create a new array without the deleted ad
      const updatedAds = ads.filter((ad) => ad.id !== adId);

      console.log("Updated ads array:", updatedAds);

      // Update state with the new array
      setAds(updatedAds);

      // If we're deleting the currently selected ad, update selectedAd
      if (selectedAd?.id === adId) {
        if (updatedAds.length > 0) {
          setSelectedAd(updatedAds[0]);
        } else {
          setSelectedAd(null);
        }
      }

      // Show success toast
      toast({
        title: "Ad deleted",
        description: adToDelete
          ? `"${adToDelete.name}" has been deleted`
          : "Ad has been deleted",
        variant: "success",
      });

      console.log("Delete operation completed");
    } catch (error) {
      console.error("Error deleting ad:", error);

      toast({
        title: "Error",
        description: "Failed to delete ad. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSaveAd = (updatedAd: Ad) => {
    setAds(ads.map((ad) => (ad.id === updatedAd.id ? updatedAd : ad)));
    setSelectedAd(updatedAd);

    toast({
      title: "Ad saved",
      description: `"${updatedAd.name}" has been saved successfully`,
      variant: "success",
    });
  };

  const handleImportAds = (importedAds: Ad[]) => {
    // Add type if missing in imported ads
    const processedAds = importedAds.map((ad) => ({
      ...ad,
      type: ad.type || "search", // Default to search if type is missing
      sitelinks: ad.sitelinks || [], // Ensure sitelinks exists
    }));

    // Merge imported ads with existing ads, avoiding duplicates by ID
    const existingIds = new Set(ads.map((ad) => ad.id));
    const newAds = processedAds.filter((ad) => !existingIds.has(ad.id));
    const updatedAds = [...ads, ...newAds];

    setAds(updatedAds);

    if (newAds.length > 0 && !selectedAd) {
      setSelectedAd(newAds[0]);
    }
  };

  const renderContent = () => {
    switch (sidebarView) {
      case "ads":
        return selectedAd ? (
          <div className="w-full">
            <AdForm
              ad={selectedAd}
              onSave={handleSaveAd}
              onPreview={() => setSidebarView("previews")}
            />
          </div>
        ) : (
          <AdList
            ads={ads}
            onSelect={handleSelectAd}
            onClone={handleCloneAd}
            onDelete={handleDeleteAd}
          />
        );
      case "previews":
        return (
          <AdPreview
            ad={selectedAd || (ads.length > 0 ? ads[0] : null)}
            allAds={ads}
            onSelectAd={setSelectedAd}
          />
        );
      case "dashboard":
      default:
        return (
          <AdList
            ads={ads}
            onSelect={handleSelectAd}
            onClone={handleCloneAd}
            onDelete={handleDeleteAd}
          />
        );
    }
  };

  const getHeaderTitle = () => {
    switch (sidebarView) {
      case "ads":
        return selectedAd ? "Edit Ad" : "All Ads";
      case "previews":
        return "Ad Previews";
      case "settings":
        return "Settings";
      case "help":
        return "Help";
      case "dashboard":
      default:
        return "Dashboard";
    }
  };

  const getHeaderDescription = () => {
    switch (sidebarView) {
      case "ads":
        return selectedAd
          ? "Edit your ad details"
          : "Manage your Google search ads";
      case "previews":
        return "Preview how your ads will appear";
      case "settings":
        return "Configure your account settings";
      case "help":
        return "Get help with using the platform";
      case "dashboard":
      default:
        return "Overview of your Google search ads";
    }
  };

  return (
    <DashboardLayout
      onAddNew={handleAddAd}
      activeView={sidebarView}
      onViewChange={setSidebarView}
    >
      <div className="w-full max-w-full">
        <DashboardHeader
          heading={getHeaderTitle()}
          description={getHeaderDescription()}
          onAddNew={
            sidebarView === "dashboard" ||
            (sidebarView === "ads" && !selectedAd)
              ? handleAddAd
              : undefined
          }
          showBackButton={sidebarView === "ads" && selectedAd !== null}
          onBack={() => {
            setSelectedAd(null);
          }}
          ads={ads}
          onImport={handleImportAds}
          showImportExport={
            sidebarView === "dashboard" ||
            (sidebarView === "ads" && !selectedAd)
          }
        />

        <div className="w-full flex-1">{renderContent()}</div>
      </div>
    </DashboardLayout>
  );
}
